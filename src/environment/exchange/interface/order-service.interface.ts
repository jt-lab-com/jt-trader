import { SystemParamsInterface } from '../../script/scenario/script-scenario.service';
import { OrderInterface } from './order.interface';
import { KLineInterface } from './kline.interface';

export interface OrderServiceInterface {
  create(order: OrderInterface): OrderInterface;

  update(orderId: string, values: OrderInterface): OrderInterface;

  setNewCandle(kline: KLineInterface): void;

  trigger(symbol: string): void;

  checkUpdates(): OrderInterface[] | undefined;

  getBalance();

  getBalanceFee(): number;

  getProfit(): number;

  getPositions(): object[];

  getOrders(): OrderInterface[];

  getOpenOrders(): OrderInterface[];

  getClosedOrders(): OrderInterface[];

  getOrder(id: string): OrderInterface;

  enableHedgeMode(): void;

  getCurrentTime(): number;

  getPricePrecision(): number;

  updateConfig(
    config: SystemParamsInterface & {
      balance?: number;
    },
  ): void;

  getConfig(): SystemParamsInterface;
}
