import { Injectable } from '@nestjs/common';
import { KLineInterface } from './interface/kline.interface';
import { OrderInterface, PositionSideType } from './interface/order.interface';
import { PositionInterface } from './interface/position.interface';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { SystemParamsInterface } from '../script/scenario/script-scenario.service';
import { OrderServiceInterface } from './interface/order-service.interface';

export const ORDER_ID_SEPARATOR = '::';

@Injectable()
export class OrderService implements OrderServiceInterface {
  private readonly openOrdersMap: Record<string, OrderInterface>;
  private readonly closedOrdersMap: Record<string, OrderInterface>;
  private readonly positions: PositionInterface[];
  private orderUpdates: Set<OrderInterface>;
  private positionUpdates: Set<PositionInterface>;
  private isHedgeMode: boolean;
  private currentTime: Date;
  private currentPrice: number;
  private balance: number;
  private marginBalance: number;
  private profit: number;
  private contractSize = 1;
  private marketOrderSpread = 0.0001;
  private pricePrecision = 2;
  private triggerPriceMax = 0;
  private triggerPriceMin = 0;
  private defaultLeverage = 1;
  private makerFee = 0;
  private takerFee = 0;
  private balanceFee = 0;
  private kline: KLineInterface;
  private nextOrderId = 1;

  constructor(@InjectPinoLogger(OrderService.name) private readonly logger: PinoLogger) {
    this.positions = [];
    this.orderUpdates = new Set<OrderInterface>();
    this.positionUpdates = new Set<PositionInterface>();
    this.isHedgeMode = true;
    this.balance = 0;
    this.marginBalance = 0;
    this.profit = 0;
    this.openOrdersMap = {};
    this.closedOrdersMap = {};
  }

  private positionBySide(side: 'sell' | 'buy' | string): PositionSideType {
    return { sell: PositionSideType.short, buy: PositionSideType.long }[side];
  }

  private updateTriggerPriceLimits = (newPrice: number = undefined): void => {
    if (!newPrice) {
      let min = 0;
      let max = 0;

      for (const orderId in this.openOrdersMap) {
        const order = this.openOrdersMap[orderId];
        max = max === 0 || order.price < max ? order.price : max;
        min = min === 0 || order.price > min ? order.price : min;
      }

      this.triggerPriceMax = max;
      this.triggerPriceMin = min;
    } else {
      this.triggerPriceMax =
        this.triggerPriceMax === 0 || this.triggerPriceMax > newPrice ? newPrice : this.triggerPriceMax;
      this.triggerPriceMin =
        this.triggerPriceMin === 0 || this.triggerPriceMin < newPrice ? newPrice : this.triggerPriceMin;
    }
  };

  public create = (order: OrderInterface): OrderInterface => {
    const reject = {
      error: '',
      clientOrderId: order.clientOrderId,
    };
    const ratio = order.side === 'buy' ? 1 : -1;

    let price =
      order.type === 'market'
        ? parseFloat((this.currentPrice * (1 + (this.marketOrderSpread / 2) * ratio)).toFixed(this.pricePrecision))
        : order.price;

    // цена limit ордера не может быть выше текущей при покупке и ниже текущей при продаже
    const diff = (order.price - this.currentPrice) * ratio;
    if (order.type === 'limit' && diff > 0) {
      reject.error = `${order.side} order price ${ratio === 1 ? 'higher' : 'lower'} current price`;
      return reject;
    }

    const isUntriggeredOrder = [!!order.stopLossPrice, !!order.takeProfitPrice].indexOf(true) > -1;

    if (isUntriggeredOrder) {
      // - если isUntriggeredOrder, то пропускать только market
      if (order.type === 'limit') {
        reject.error = 'Only market stop orders available';
        return reject;
      }

      // - передать можно только 1 параметр из stopLossPrice, takeProfitPrice
      if (!!order.stopLossPrice === true && !!order.takeProfitPrice === true) {
        reject.error = 'Only one of fields value available (stopLossPrice or takeProfitPrice)';
        return reject;
      }

      // - цена ордера = триггер цена
      price = !!order.stopLossPrice ? order.stopLossPrice : order.takeProfitPrice;
      // - если передан stopLossPrice, takeProfitPrice - всегда reduceOnly = true
      order.reduceOnly = true;
    }

    let positionSide = PositionSideType.both;
    let reduceOnly: boolean = order.reduceOnly !== undefined ? order.reduceOnly : false;
    if (this.isHedgeMode) {
      if ([PositionSideType.short, PositionSideType.long].indexOf(order.positionSide) === -1) {
        reject.error = `positionSide field required values: ${PositionSideType.short}, ${PositionSideType.long}`;
        return reject;
      }

      positionSide = order.positionSide;
      reduceOnly = order.positionSide !== this.positionBySide(order.side);
    }

    const fee = order.type === 'limit' ? this.makerFee : this.takerFee;
    const currentOrder: OrderInterface = {
      id: `${this.nextOrderId++}${ORDER_ID_SEPARATOR}${order.symbol}`,
      clientOrderId: order.clientOrderId,
      datetime: new Date(this.getCurrentTime()).toISOString(),
      symbol: order.symbol,
      type: order.type,
      side: order.side,
      amount: order.amount ?? 0,
      price,
      status: isUntriggeredOrder ? 'untriggered' : 'open',
      reduceOnly,
      positionSide,
      lastTradeTimestamp: 0,
      timeInForce: 'IOC',
      average: 0,
      filled: 0,
      remaining: 0,
      cost: price * order.amount,
      trades: [],
      fee: {
        currency: '',
        cost: order.amount * price * fee,
      },
      info: {},
      // ...order,
      /* TODO: new fields:
         filled = amount
         remaining  = 0
         average = price
         cost = amount * price
         lastTradeTimestamp = current candle time
       */
      timestamp: this.getCurrentTime(),
    };

    this.openOrdersMap[currentOrder.id] = currentOrder;
    this.orderUpdates.add({ ...currentOrder });

    if (currentOrder.type === 'market' && currentOrder.status === 'open') {
      this.execute(currentOrder);
    } else {
      this.updateTriggerPriceLimits(currentOrder.price);
    }

    return { ...currentOrder };
  };

  public update(orderId: string, values: OrderInterface): OrderInterface {
    const order = this.openOrdersMap[orderId];
    if (!order) return;

    const updatedOrder = { ...order, ...values };

    if (['closed', 'canceled'].includes(updatedOrder.status)) {
      this.closedOrdersMap[orderId] = updatedOrder;
      delete this.openOrdersMap[orderId];
    } else {
      this.openOrdersMap[orderId] = updatedOrder;
    }

    this.orderUpdates.add({ ...updatedOrder, datetime: new Date(this.getCurrentTime()).toISOString() });
    if (updatedOrder.status === 'closed') {
      for (const position of this.positions) {
        this.positionUpdates.add({ ...position, datetime: new Date(this.getCurrentTime()).toISOString() });
      }
    }

    return { ...updatedOrder };
  }

  public setNewCandle(kline: KLineInterface): void {
    this.currentTime = new Date(kline.timestamp);
    this.currentPrice = kline.close;
    this.kline = kline;
  }

  public trigger = (symbol: string): void => {
    const kLine = this.kline;

    if (this.positions.length) {
      // обновляем unrealizedPnl и балансы
      const [initialMarginAll, unrealizedPnlAll] = this.positions.reduce(
        ([initialMargin, unrealizedPnl], item) => {
          if (item.symbol === symbol) {
            item.markPrice = kLine.close;
            const ratio = item.side === PositionSideType.long ? 1 : -1;
            item.unrealizedPnl = (item.markPrice - item.entryPrice) * item.contracts * ratio;
            return [initialMargin + item.initialMargin, unrealizedPnl + item.unrealizedPnl];
          }
          return [initialMargin, unrealizedPnl];
        },
        [0, 0],
      );

      // const diff = initialMarginAll + unrealizedPnlAll > 0 ? initialMarginAll : unrealizedPnlAll;
      // this.marginBalance = this.balance - diff;

      const diff = initialMarginAll + unrealizedPnlAll > 0 ? initialMarginAll : unrealizedPnlAll;
      this.marginBalance = this.balance + diff;

      // this.marginBalance = initialMarginAll + unrealizedPnlAll > 0 ? initialMarginAll : unrealizedPnlAll;
    }

    // проверяем, где цена, и исполняем ордер
    if (
      (this.triggerPriceMax && kLine.high >= this.triggerPriceMax) ||
      (this.triggerPriceMin && kLine.low <= this.triggerPriceMin)
    ) {
      let executed = false;

      const orders = Object.values(this.openOrdersMap);

      for (const order of orders) {
        if (kLine.high >= order.price && kLine.low <= order.price) {
          this.execute({ ...order, timestamp: this.getCurrentTime() });
          executed = true;
        }
      }

      if (executed) this.updateTriggerPriceLimits();
    }
  };

  public checkOrdersUpdates(): OrderInterface[] | undefined {
    if (this.orderUpdates.size === 0) return;

    const values = [...this.orderUpdates.values()];
    this.orderUpdates.clear();
    return values;
  }

  public checkPositionsUpdates(): PositionInterface[] | undefined {
    if (this.positionUpdates.size === 0) return;

    const values = [...this.positionUpdates.values()];
    this.positionUpdates.clear();
    return values;
  }

  public checkBalanceUpdates() {
    return this.getBalance();
  }

  private execute(order: OrderInterface): void {
    const positionIndex = this.isHedgeMode ? (order.positionSide === PositionSideType.long ? 0 : 1) : 0;
    let position = this.positions[positionIndex];

    if (order.reduceOnly && !position) {
      this.update(order.id, { status: 'canceled' });
      this.logger.info({ order }, 'ReduceOnly order cancelled');
      return;
    }

    if (!position) {
      const notional = order.amount * order.price * this.contractSize;
      const initialMargin = notional / this.defaultLeverage;

      position = {
        id: order.id,
        symbol: order.symbol,
        hedged: !!this.isHedgeMode,
        side: this.positionBySide(order.side),
        contracts: order.amount,
        contractSize: this.contractSize,
        entryPrice: order.price,
        markPrice: order.price,
        unrealizedPnl: 0,
        timestamp: order.timestamp,
        leverage: this.defaultLeverage,
        liquidationPrice: 0,
        collateral: 0,
        notional,
        initialMargin,
        initialMarginPercentage: Math.round((1 / this.defaultLeverage) * 100),
        maintenanceMargin: 0,
        maintenanceMarginPercentage: 0,
        marginRatio: 0,
        datetime: '',
        marginMode: 'cross',
        marginType: 'cross',
        percentage: 0,
      };

      this.balance -= initialMargin;
      this.marginBalance += this.balance + initialMargin;
      // this.marginBalance += initialMargin;
    } else {
      const ratio = position.side === this.positionBySide(order.side) ? 1 : -1;
      position.entryPrice =
        ratio === 1
          ? (position.entryPrice * position.contracts + order.price * order.amount) /
            (position.contracts + order.amount)
          : position.entryPrice;

      const prevMargin = position.initialMargin;
      const prevContracts = position.contracts;
      const shiftedContracts: number = position.contracts + ratio * order.amount;

      if (!isFinite(shiftedContracts)) throw new Error('positions.contracts variable type overloaded');

      if (shiftedContracts < 0) {
        order.amount = position.contracts;
        position.contracts = 0;
      } else {
        position.contracts = shiftedContracts;
      }

      const unrealizedPnl =
        (position.markPrice - position.entryPrice) *
        position.contracts *
        (position.side === PositionSideType.long ? 1 : -1);

      const profit = ratio === -1 ? (order.price - position.entryPrice) * order.amount : 0;
      // const profit = ratio === -1 ? position.unrealizedPnl - unrealizedPnl : 0;
      this.profit += position.side === PositionSideType.short ? profit * -1 : profit;
      // this.profit += ratio === -1 ? (order.price - position.entryPrice) * order.amount : 0;
      position.unrealizedPnl = unrealizedPnl;

      const notional = position.contracts * position.entryPrice * this.contractSize;
      const initialMargin = notional / this.defaultLeverage;

      // изменяем balance при уменьшении позиции
      if (prevContracts > position.contracts) {
        this.balance += profit;
        this.marginBalance = this.marginBalance - prevMargin + initialMargin;
        // this.marginBalance = this.balance + profit
      } else {
        // this.balance = this.balance - position.entryPrice * order.amount;
        this.balance = this.balance - order.price * order.amount;
        this.marginBalance = this.marginBalance + initialMargin;
        // this.marginBalance = this.marginBalance - prevMargin + initialMargin;
      }

      // this.marginBalance = this.balance + unrealizedPnl;
    }

    this.positions.splice(positionIndex, 1);

    if (position.contracts > 0) {
      this.positions[positionIndex] = position;
    }

    this.balance -= order.fee.cost;
    this.balanceFee += order.fee.cost;

    // this.balance += order.price * order.amount * (order.side === 'buy' ? -1 : 1);
    this.update(order.id, {
      status: 'closed',
      timestamp: order.timestamp,
      average: order.price,
      filled: order.amount,
      lastTradeTimestamp: order.timestamp,
      remaining: 0,
      datetime: new Date(this.getCurrentTime()).toISOString(),
    });
    // this.logger.info({ order }, 'Order executed');
  }

  public getBalance = () => {
    return { balance: this.balance, marginBalance: this.marginBalance };
  };

  public getBalanceFee = (): number => {
    return this.balanceFee;
  };

  public getProfit = (): number => {
    return this.profit;
  };

  public getPositions = (): object[] => {
    const positions = [];

    for (const pos of this.positions) {
      if (!pos) continue;
      positions.push({ ...pos });
    }

    return positions;
  };

  public getOrders = (): OrderInterface[] => {
    return [...Object.values(this.openOrdersMap), ...Object.values(this.closedOrdersMap)];
  };

  public getOpenOrders = (): OrderInterface[] => {
    return Object.values(this.openOrdersMap);
  };

  public getClosedOrders = (): OrderInterface[] => {
    return Object.values(this.closedOrdersMap);
  };

  public getOrder = (orderId: string): OrderInterface => {
    return this.openOrdersMap[orderId] ?? this.closedOrdersMap[orderId];
  };

  public enableHedgeMode = (): void => {
    this.isHedgeMode = true;
  };

  public getCurrentTime = (): number => {
    return this.currentTime?.getTime() ?? Date.now();
  };

  public getPricePrecision = (): number => {
    return this.pricePrecision;
  };

  public updateConfig = (
    config: SystemParamsInterface & {
      balance?: number;
    },
  ): void => {
    this.marketOrderSpread = config.marketOrderSpread ?? this.marketOrderSpread;
    this.pricePrecision = config.pricePrecision ?? this.pricePrecision;
    this.balance = config.balance ?? this.balance;
    this.defaultLeverage = config.defaultLeverage ?? this.defaultLeverage;
    this.makerFee = config.makerFee ?? this.makerFee;
    this.takerFee = config.takerFee ?? this.takerFee;
    this.isHedgeMode = config.hedgeMode ?? this.isHedgeMode;
    this.contractSize = config.contractSize ?? this.contractSize;
  };

  public getConfig(): SystemParamsInterface {
    return {
      marketOrderSpread: this.marketOrderSpread,
      pricePrecision: this.pricePrecision,
    };
  }
}
