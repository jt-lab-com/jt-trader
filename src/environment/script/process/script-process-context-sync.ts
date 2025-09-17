import { OrderInterface } from '../../exchange/interface/order.interface';
import { BaseScriptInterface } from '../../../common/types';
import { ExceptionReasonType } from '../../../exception/types';
import { ScriptProcessContextBase } from './script-process-context-base';

export class ScriptProcessContextSync extends ScriptProcessContextBase {
  public updateArgs(instance: BaseScriptInterface) {
    const { symbols, connectionName, interval } = instance;
    this.args = { symbols, connectionName, interval };
    this.keys = { apiKey: 'xxxxx', secret: 'yyyyy' };
    this._callInstance = (method, data = undefined) => {
      try {
        if (typeof instance[method] !== 'function') {
          throw new Error(`Strategy.${method} is not a function`);
        }
        return instance[method](data);
      } catch (e) {
        e.cause = ExceptionReasonType.UserScript;
        e.key = this.key;
        e.logger = this.logger;
        throw e;
      }
    };
  }

  public systemUsage() {
    // const previousUsage = process.cpuUsage();
    // const startDate = Date.now();
    // while (Date.now() - startDate < 50);
    //  const usage = process.cpuUsage(previousUsage);
    // const result = (100 * (usage.user + usage.system)) / 50000;

    return {
      pid: process.pid,
      cpu: 100, // Math.round(result),
      memory: Math.round(process.memoryUsage()?.heapUsed / (1024 * 1024)),
    };
  }

  public subscribeDataFeeds() {
    this._call('watchEndOfTick', [
      (data) => {
        return this._callInstance('runTickEnded', data);
      },
    ]);

    super.subscribeDataFeeds();
  }

  /*
   * args: [type, side, amount, price, params]
   * */
  public createOrder(...args: any[]): OrderInterface {
    const [symbol, type, side, amount, price, params] = args;
    const clientOrderId = params?.clientOrderId;

    try {
      return this._call('createOrder', [
        symbol,
        type,
        side,
        amount,
        price,
        {
          ...params,
        },
      ]);
    } catch (e) {
      e.clientOrderId = clientOrderId;
      throw e;
    }
  }

  public getOrders(...args: any[]): OrderInterface[] {
    const [symbol, ...rest] = args;
    return this._call('fetchOrders', [symbol, ...rest]);
  }

  public getOpenOrders(...args: any[]): Promise<OrderInterface[]> {
    const [symbol, ...rest] = args;
    return this._call('fetchOpenOrders', [symbol, ...rest]);
  }

  public getClosedOrders(...args: any[]): Promise<OrderInterface[]> {
    const [symbol, ...rest] = args;
    return this._call('fetchClosedOrders', [symbol, ...rest]);
  }

  getOrder(...args: any[]): OrderInterface {
    const [orderId, ...rest] = args;
    const all = this.getOrders(...rest);

    return all.find(({ id }) => id === orderId);
  }

  symbolInfo(symbol) {
    return this.getSymbolInfo(symbol, this.args.connectionName);
  }
}
