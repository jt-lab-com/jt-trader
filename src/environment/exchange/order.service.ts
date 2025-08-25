import { Injectable } from '@nestjs/common';
import { KLineInterface } from './interface/kline.interface';
import { OrderInterface, PositionSideType } from './interface/order.interface';
import { PositionInterface } from './interface/position.interface';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { SystemParamsInterface } from '../script/scenario/script-scenario.service';
import { OrderServiceInterface } from './interface/order-service.interface';

@Injectable()
export class OrderService implements OrderServiceInterface {
  private orders: OrderInterface[];
  private positions: PositionInterface[];
  private updates: Set<OrderInterface>;
  private isHedgeMode: boolean;
  private currentTime: Date;
  private currentPrice: number;
  private balance: number;
  private marginBalance: number;
  private profit: number;
  private marketOrderSpread = 0.0001;
  private pricePrecision = 2;
  private triggerPriceMax = 0;
  private triggerPriceMin = 0;
  private defaultLeverage = 1;
  private makerFee = 0;
  private takerFee = 0;
  private balanceFee = 0;
  private kline: KLineInterface;

  constructor(@InjectPinoLogger(OrderService.name) private readonly logger: PinoLogger) {
    this.orders = [];
    this.positions = [];
    this.updates = new Set<OrderInterface>();
    this.isHedgeMode = false;
    this.balance = 0;
    this.marginBalance = 0;
    this.profit = 0;
  }

  private positionBySide(side: 'sell' | 'buy' | string): PositionSideType {
    return { sell: PositionSideType.short, buy: PositionSideType.long }[side];
  }

  private updateTriggerPriceLimits = (newPrice: number = undefined): void => {
    if (!newPrice) {
      const { max, min } = this.orders
        .filter((order) => order.status === 'open')
        .reduce(
          (acc, order) => {
            let { max, min } = acc;
            max = max === 0 || order.price < max ? order.price : max;
            min = min === 0 || order.price > min ? order.price : min;
            return { max, min };
          },
          { max: 0, min: 0 },
        );
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
      id: `${this.orders.length + 1}`,
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

    this.orders.push(currentOrder);
    this.updates.add({ ...currentOrder });

    if (currentOrder.type === 'market' && currentOrder.status === 'open') {
      this.execute(currentOrder);
    } else {
      this.updateTriggerPriceLimits(currentOrder.price);
    }

    return { ...currentOrder };
  };

  public update(orderId: string, values: OrderInterface): OrderInterface {
    const order: OrderInterface = this.orders.find(({ id }) => orderId === id);
    const value: OrderInterface = { ...order, ...values };

    this.orders = [...this.orders.filter((item) => item.id !== order.id), value];

    this.updates.add({ ...value, datetime: new Date(this.getCurrentTime()).toISOString() });
    return { ...value };
  }

  public setNewCandle(kline: KLineInterface): void {
    this.currentTime = new Date(kline.timestamp);
    this.currentPrice = kline.close;
    this.kline = kline;
  }

  public trigger = (symbol: string): void => {
    const kLine = this.kline;
    const currentTime = this.currentTime;

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
    const diff = initialMarginAll + unrealizedPnlAll > 0 ? initialMarginAll : unrealizedPnlAll;
    this.marginBalance = this.balance - diff;

    // проверяем, где цена, и исполняем ордер
    if (
      (this.triggerPriceMax && kLine.high >= this.triggerPriceMax) ||
      (this.triggerPriceMin && kLine.low <= this.triggerPriceMin)
    ) {
      let executed = false;
      this.orders
        .filter(
          (order) => order.timestamp < this.getCurrentTime() && ['open', 'untriggered'].indexOf(order.status) > -1,
        )
        .map((order) => {
          if (kLine.high >= order.price && kLine.low <= order.price) {
            this.execute({ ...order, timestamp: currentTime.getTime() });
            executed = true;
          }
        });

      if (executed) this.updateTriggerPriceLimits();
    }
  };

  public checkUpdates(): OrderInterface[] | undefined {
    if (this.updates.size === 0) return;

    const values = [...this.updates.values()];
    this.updates.clear();
    return values;
  }

  private execute(order: OrderInterface): void {
    let position = this.positions.find((position) => {
      if (order.positionSide === PositionSideType.both) return position.symbol === order.symbol;
      else return position.symbol === order.symbol && position.side === order.positionSide;
    });

    if (order.reduceOnly && !position) {
      this.update(order.id, { status: 'canceled' });
      this.logger.info({ order }, 'ReduceOnly order cancelled');
      return;
    }

    if (!position) {
      position = {
        id: order.id,
        symbol: order.symbol,
        hedged: !!this.isHedgeMode,
        side: this.positionBySide(order.side),
        contracts: order.amount,
        contractSize: 1,
        entryPrice: order.price,
        markPrice: order.price,
        unrealizedPnl: 0,
        timestamp: order.timestamp,
        leverage: this.defaultLeverage,
        liquidationPrice: 0,
        collateral: 0,
        notional: order.amount * order.price,
        initialMargin: order.amount * order.price * (1 / this.defaultLeverage),
        initialMarginPercentage: Math.round((1 / this.defaultLeverage) * 100),
        maintenanceMargin: 0,
        maintenanceMarginPercentage: 0,
        marginRatio: 0,
        datetime: '',
        marginMode: 'cross',
        marginType: 'cross',
        percentage: 0,
      };
    } else {
      const ratio = position.side === this.positionBySide(order.side) ? 1 : -1;
      position.entryPrice =
        ratio === 1
          ? (position.entryPrice * position.contracts + order.price * order.amount) /
            (position.contracts + order.amount)
          : position.entryPrice;

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

      // изменяем balance при уменьшении позиции
      if (prevContracts > position.contracts) {
        this.balance += profit;
      }
    }

    this.positions = this.positions.filter((item) => item.id !== position.id);
    if (position.contracts > 0) {
      this.positions.push({ ...position, timestamp: order.timestamp });
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
    //return this.positions.map((position) => ({ ...position }));
    return this.positions;
  };

  public getOrders = (): OrderInterface[] => {
    return [...this.orders];
  };

  public enableHedgeMode = (): void => {
    this.isHedgeMode = true;
  };

  public getCurrentTime = (): number => {
    return this.currentTime.getTime();
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
  };

  public getConfig(): SystemParamsInterface {
    return {
      marketOrderSpread: this.marketOrderSpread,
      pricePrecision: this.pricePrecision,
    };
  }
}
