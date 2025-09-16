import { OrderService, ORDER_ID_SEPARATOR } from './order.service';
import { OrderInterface } from './interface/order.interface';
import { PinoLogger } from 'nestjs-pino';
import { KLineInterface } from './interface/kline.interface';
import { OrderServiceInterface } from './interface/order-service.interface';
import { SystemParamsInterface } from '../script/scenario/script-scenario.service';
import { PositionInterface } from './interface/position.interface';

export class MultiCartOrderService implements OrderServiceInterface {
  private carts: Map<string, OrderService>;
  private currentTime: Date;
  private balance: number;
  private marginBalance: number;

  constructor(private readonly logger: PinoLogger) {
    this.carts = new Map<string, OrderService>();
    this.balance = 0;
    this.marginBalance = 0;
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

  public checkOrdersUpdates(): OrderInterface[] | undefined {
    const updates: OrderInterface[] = [];
    for (const [_, cart] of this.carts.entries()) {
      const items = cart.checkOrdersUpdates();
      if (items && items.length > 0) {
        updates.push(...items);
      }
    }

    return updates.length > 0 ? updates : undefined;
  }

  public checkPositionsUpdates(): PositionInterface[] | undefined {
    const updates: PositionInterface[] = [];
    for (const [_, cart] of this.carts.entries()) {
      const items = cart.checkPositionsUpdates();
      if (items?.length > 0) {
        updates.push(...items);
      }
    }

    return updates.length > 0 ? updates : undefined;
  }

  public checkBalanceUpdates() {
    const { balance, marginBalance } = this.getBalance();
    if (this.balance === balance && this.marginBalance === marginBalance) return;
    this.balance = balance;
    this.marginBalance = marginBalance;
    return { balance, marginBalance };
  }

  updateConfig(config: SystemParamsInterface & { balance?: number }, symbol?: string): void {
    if (symbol) {
      const cart = this.selectCart(symbol);
      cart.updateConfig(config);
      return;
    }

    for (const [_, cart] of this.carts.entries()) {
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
      balance += itemBalance;
      marginBalance += itemMarginBalance;
    }

    return { balance, marginBalance };
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

  getOpenOrders(): OrderInterface[] {
    const set: OrderInterface[] = [];
    for (const [, cart] of this.carts.entries()) {
      set.push(...cart.getOpenOrders());
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

  getPricePrecision(symbol?: string): number {
    for (const [cartSymbol, cart] of this.carts.entries()) {
      if (!symbol) return cart.getPricePrecision();
      if (cartSymbol !== symbol) continue;
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

  getLeverageLimits(symbol: string) {
    const cart = this.selectCart(symbol);
    return cart.getLeverageLimits();
  }
}
