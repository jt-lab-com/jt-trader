import { OrderInterface } from '../../exchange/interface/order.interface';
import { BaseScriptInterface } from '../../../common/types';
import { ExceptionReasonType } from '../../../exception/types';
import { ScriptProcessContextBase } from './script-process-context-base';
import { nanoid } from 'nanoid';

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
      return { error: e.message, clientOrderId } as OrderInterface;
    }
  }

  public getOrders(...args: any[]): OrderInterface[] {
    const [symbol, ...rest] = args;
    return this._call('fetchOrders', [symbol, ...rest]);
  }

  getOrder(...args: any[]): OrderInterface {
    const [orderId, ...rest] = args;
    const all = this.getOrders(...rest);

    return all.find(({ id }) => id === orderId);
  }

  symbolInfo(symbol) {
    return this.getSymbolInfo(symbol);
  }
}
