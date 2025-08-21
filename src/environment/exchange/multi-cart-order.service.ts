import { OrderService, ORDER_ID_SEPARATOR } from './order.service';
import { OrderInterface } from './interface/order.interface';
import { PinoLogger } from 'nestjs-pino';
import { KLineInterface } from './interface/kline.interface';
import { OrderServiceInterface } from './interface/order-service.interface';
import { SystemParamsInterface } from '../script/scenario/script-scenario.service';

export class MultiCartOrderService implements OrderServiceInterface {
  private carts: Map<string, OrderService>;
  private currentTime: Date;
  private balance: number;

  constructor(private readonly logger: PinoLogger) {
    this.carts = new Map<string, OrderService>();
    this.balance = 0;
  }

  private selectCart(symbol: string): OrderService {
    let cart = this.carts.get(symbol);
    if (!cart) {
      cart = new OrderService(this.logger);
      this.carts.set(symbol, cart);
    }

    return cart;
  }

  public create(order: OrderInterface): OrderInterface {
    const cart = this.selectCart(order.symbol);
    return cart.create(order);
  }

  public update(orderId: string, values: OrderInterface): OrderInterface {
    const [_, symbol] = orderId.split(ORDER_ID_SEPARATOR);
    const cart = this.selectCart(symbol);
    return cart.update(orderId, values);
  }

  public setNewCandle(kline: KLineInterface): void {
    this.currentTime = new Date(kline.timestamp);
    const cart = this.selectCart(kline.symbol);
    return cart.setNewCandle(kline);
  }

  public trigger = (symbol: string): void => {
    const cart = this.selectCart(symbol);
    return cart.trigger(symbol);
  };

  public checkUpdates(): OrderInterface[] | undefined {
    const updates: OrderInterface[] = [];
    for (const [symbol, cart] of this.carts.entries()) {
      const items = cart.checkUpdates();
      if (items && items.length > 0) {
        updates.push(...items);
      }
    }

    return updates.length > 0 ? updates : undefined;
  }

  updateConfig(config: SystemParamsInterface & { balance?: number }): void {
    for (const [, cart] of this.carts.entries()) {
      cart.updateConfig(config);
    }
  }

  enableHedgeMode(): void {
    for (const [, cart] of this.carts.entries()) {
      cart.enableHedgeMode();
    }
  }

  getBalance() {
    let [balance, marginBalance]: number[] = [0, 0];
    for (const [, cart] of this.carts.entries()) {
      const { balance: itemBalance, marginBalance: itemMarginBalance } = cart.getBalance();
      balance += itemBalance - this.balance;
    }

    return { balance: this.balance + balance, marginBalance };
  }

  getBalanceFee(): number {
    let fee = 0;
    for (const [, cart] of this.carts.entries()) {
      fee += cart.getBalanceFee();
    }

    return fee;
  }

  getConfig(): SystemParamsInterface {
    for (const [, cart] of this.carts.entries()) {
      return cart.getConfig();
    }
  }

  getCurrentTime(): number {
    return this.currentTime.getTime();
  }

  getOrders(): OrderInterface[] {
    const set: OrderInterface[] = [];
    for (const [, cart] of this.carts.entries()) {
      set.push(...cart.getOrders());
    }

    return set;
  }

  getOpenedOrders(): OrderInterface[] {
    const set: OrderInterface[] = [];
    for (const [, cart] of this.carts.entries()) {
      set.push(...cart.getOpenedOrders());
    }

    return set;
  }

  getClosedOrders(): OrderInterface[] {
    const set: OrderInterface[] = [];
    for (const [, cart] of this.carts.entries()) {
      set.push(...cart.getClosedOrders());
    }

    return set;
  }

  getOrder(orderId: string): OrderInterface {
    const [_, symbol] = orderId.split(ORDER_ID_SEPARATOR);
    const cart = this.selectCart(symbol);
    return cart.getOrder(orderId);
  }

  getPositions(): object[] {
    const set: OrderInterface[] = [];
    for (const [, cart] of this.carts.entries()) {
      set.push(...cart.getPositions());
    }

    return set;
  }

  getPricePrecision(): number {
    for (const [, cart] of this.carts.entries()) {
      return cart.getPricePrecision();
    }
  }

  getProfit(): number {
    let profit = 0;
    for (const [, cart] of this.carts.entries()) {
      profit += cart.getProfit();
    }

    return profit;
  }
}
