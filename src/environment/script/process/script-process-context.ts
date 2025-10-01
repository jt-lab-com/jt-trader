import { OrderInterface } from '../../exchange/interface/order.interface';
import { Balance, Exchange, OrderBook, Position } from 'ccxt';
import { BaseScriptInterface } from '../../../common/types';
import { ExceptionReasonType } from '../../../exception/types';
import { ScriptProcessContextBase } from './script-process-context-base';
import { LeakyBucket } from '../../../common/leaky-bucket';

export class ScriptProcessContext extends ScriptProcessContextBase {
  private bucket: LeakyBucket;
  private positions: Position[];
  private balance: Balance;

  constructor(...args) {
    // @ts-ignore
    super(...args);

    this.bucket = new LeakyBucket({
      capacity: this.apiCallLimitPerSecond,
      interval: 1,
    });
  }

  updateArgs = async (instance: BaseScriptInterface, loadTickers = true) => {
    const { symbols, connectionName, interval, marketType } = instance;
    this.args = { symbols, connectionName, interval, marketType };
    if (this.isTester()) {
      this.keys = { apiKey: 'xxxxx', secret: 'yyyyy' };
    } else {
      this.keys = await this.keysStorage.selectKeys(connectionName, this.accountId);
    }

    const sdk = this.exchange.getSDK(this.args.connectionName, this.args.marketType, this.keys);
    await sdk.loadMarkets(false);

    if (loadTickers) {
      await this.loadTickers();
    }

    this._callInstance = async (method, data = undefined, emitOnly = false) => {
      const tickMethods = ['runOnTick', 'runOnTimer'];
      try {
        // если метод runOnEvent объявлен и не TICKER событие, только runtime
        if (!this.isTester() && typeof instance.runOnEvent === 'function' && tickMethods.indexOf(method) === -1) {
          await instance.runOnEvent(method, data);
        }
        if (emitOnly) return;

        if (typeof instance[method] !== 'function') {
          throw new Error(`Strategy.${method} is not a function`);
        }
        if (tickMethods.indexOf(method) > -1) {
          if (this.tickIsLocked === true) {
            return;
          }
          this.tickIsLocked = true;
        }

        return await instance[method](data);
      } catch (e) {
        e.cause = ExceptionReasonType.UserScript;
        e.key = this.key;
        e.logger = this.logger;
        throw e;
      } finally {
        if (tickMethods.indexOf(method) > -1) {
          this.tickIsLocked = false;
        }
      }
    };
  };

  public subscribeDataFeeds() {
    if (this.isTester()) {
      this._call('watchEndOfTick', [
        async (data) => {
          return await this._callInstance('runTickEnded', data);
        },
      ]).catch((e) => {
        e.cause = ExceptionReasonType.UserScript;
        e.key = this.key;
        e.logger = this.logger;
        throw e;
      });
    }

    super.subscribeDataFeeds();
    if (this.isTester()) return;

    const { connectionName, symbols } = this.args;
    this.subscribers.set(
      'balance::all',
      this.dataFeedFactory.subscribeBalance(connectionName, this.keys, (data) => {
        this.balance = data;
        return this._callInstance('runOnBalanceChange', data, true);
      }),
    );

    const filteredSymbols = symbols.filter((symbol) => {
      const info = this.symbolInfo(symbol);
      return info?.contract === true;
    });

    if (filteredSymbols.length && filteredSymbols.length > 0)
      this.subscribers.set(
        'positions::all',
        this.dataFeedFactory.subscribePositions(connectionName, symbols, this.keys, (data) => {
          for (const position of data) {
            const index = this.positions.findIndex(
              (item) => item.symbol === position.symbol && item.side === position.side,
            );

            if (index >= 0) this.positions[index] = position;
            else this.positions.push(position);
          }
          return this._callInstance('runOnPositionsChange', data, true);
        }),
      );
  }

  public unsubscribeDataFeeds() {
    const { connectionName, symbols } = this.args;
    super.unsubscribeDataFeeds();
    this.dataFeedFactory.unsubscribeBalance(connectionName, this.keys, this.subscribers.get('balance::all'));
    this.dataFeedFactory.unsubscribePositions(
      connectionName,
      symbols,
      this.keys,
      this.subscribers.get('positions::all'),
    );
  }

  protected async _call<T>(method: string, args: any[]): Promise<T> {
    const { connectionName, marketType } = this.args;
    const sdk: Exchange = this.exchange.getSDK(connectionName, marketType, this.keys);
    const internalMethod = method === 'getHistory' ? 'fetchOHLCV' : method;

    try {
      if (!this.isTester()) {
        await this.bucket.throttle(1);
      }
      const result = await sdk[internalMethod](...args);
      if (!this.isTester()) {
        this.logger.debug(
          { method, args: JSON.stringify(args), result: JSON.stringify(result)?.slice(0, 100) },
          'SDK call',
        );
      }
      await this.runCallback(method, args, result);
      return result;
    } catch (e) {
      e.cause = ExceptionReasonType.UserScript;
      e.key = this.key;
      e.logger = this.logger;
      throw e;
    }
  }

  protected async runCallback(method: string, args: any[], data?: any): Promise<void> {
    if (!this.callbacks.has(method)) {
      return;
    }

    const items = this.callbacks.get(method);
    for (const callback of items) {
      await callback(args, data);
    }
  }

  /*
   * args: [type, side, amount, price, params]
   * */
  public async createOrder(...args: any[]): Promise<OrderInterface> {
    const [symbol, type, side, amount, price, params] = args;
    const clientOrderId = params?.clientOrderId;

    try {
      return await this._call('createOrder', [
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
      this.error(e.toString(), { stack: e.stack?.split('\n'), clientOrderId });
      throw e;
    }
  }

  protected async _updateOrder(method: 'editOrder' | 'cancelOrder', ...args: any[]) {
    const [orderId, ...rest] = args;
    try {
      return await this._call(method, [orderId, ...rest]);
    } catch (e) {
      this.error(e.toString(), { stack: e.stack?.split('\n') });
      throw e;
    }
  }

  public async getOrders(...args: any[]): Promise<OrderInterface[]> {
    const [symbol, ...rest] = args;
    return await this._call('fetchOrders', [symbol, ...rest]);
  }

  public async getOrder(...args: any[]): Promise<OrderInterface> {
    const [orderId, ...rest] = args;
    const all = await this.getOrders(...rest);

    return all.find(({ id }) => id === orderId);
  }

  public symbolInfo(symbol) {
    if (this.isTester()) return this.getSymbolInfo(symbol, this.args.connectionName);
    const sdk = this.exchange.getSDK(this.args.connectionName, this.args.marketType, this.keys);
    return { ...sdk.market(symbol) };
  }

  public systemUsage() {
    const previousUsage = process.cpuUsage();
    const startDate = Date.now();
    while (Date.now() - startDate < 50);
    const usage = process.cpuUsage(previousUsage);
    const result = (100 * (usage.user + usage.system)) / 50000;

    return {
      pid: process.pid,
      cpu: Math.round(result),
      memory: Math.round(process.memoryUsage()?.heapUsed / (1024 * 1024)),
    };
  }

  public async getPositions(
    symbols: string[],
    params: { forceFetch: boolean } & Record<string, unknown>,
  ): Promise<Position[]> {
    if (params?.forceFetch) {
      this.positions = await this._call<Position[]>('fetchPositions', [undefined, params]);
    }

    if (!Array.isArray(this.positions)) {
      this.positions = await this._call<Position[]>('fetchPositions', [undefined, params]);
    }

    const result = [...this.positions];
    if (!symbols) return result;

    return result.filter((item) => symbols.indexOf(item.symbol) > -1);
  }

  public async getBalance(params = {}): Promise<Balance> {
    if (!this.balance) {
      this.balance = await this._call<Balance>('fetchBalance', [params]);
    }

    return this.balance;
  }

  public async loadTickers() {
    const { connectionName, symbols, marketType } = this.args;
    const sdk: Exchange = this.exchange.getSDK(connectionName, marketType, this.keys);
    const assets = sdk.markets;

    for (const symbol of symbols) {
      const item = assets[symbol];
      if (!item) throw new Error(`Invalid symbol ${symbol}`);
      if (item.active !== true) throw new Error(`Inactive symbol ${symbol}`);
    }

    for (const symbol of symbols) {
      const orderBook: OrderBook = await this._call('fetchOrderBook', [symbol, 5]);
      this.ordersBook[symbol] = {
        bids: orderBook.bids,
        asks: orderBook.asks,
      };

      this.info(`${symbol} order book loaded`);
    }

    const tickers = await this._call('fetchTickers', []);
    Object.values(tickers).map((data) => {
      if (symbols.indexOf(data.symbol) === -1) return;
      this._tickerUpdate(data.symbol, data);
      this.info(`${data.symbol} last tick loaded`);
    });
  }

  //---------
  //ask()
  //bid()
  //mark_price() = (ask() + bid() )/ 2
  //currentTime()
  //------Script - Events -------
  //onTick()
  //onEvent(event, data)
}
