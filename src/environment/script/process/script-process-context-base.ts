import { StrategyArgsType } from '../../exchange/interface/strategy.interface';
import { ExchangeKeysType } from '../../../common/interface/exchange-sdk.interface';
import { Balance, Exchange, Ticker } from 'ccxt';
import { DataFeedFactory } from '../../data-feed/data-feed.factory';
import { CCXTService } from '../../exchange/ccxt.service';
import { PinoLogger } from 'nestjs-pino';
import { Logger } from 'pino';
import { ScriptExchangeKeysService } from '../storage/script-exchange-keys.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CacheService } from '../../../common/cache/cache.service';
import { ScriptArtifactsService } from '../artifacts/script-artifacts.service';
import { StrategyBundle } from '../bundler/script-bundler.service';
import { ExceptionReasonType } from '../../../exception/types';
import { OrderInterface } from '../../exchange/interface/order.interface';
import axios, { AxiosRequestConfig } from 'axios';
import { SocksProxyAgent } from 'socks-proxy-agent';

export class ScriptProcessContextBase {
  protected args: StrategyArgsType;
  protected keys: ExchangeKeysType;
  protected ordersBook: {
    [symbol: string]: {
      asks: [number, number][];
      bids: [number, number][];
    };
  };
  protected subscribers: Map<string, number>;
  protected callbacks: Map<string, ((args: any[], data?: any) => void | Promise<void>)[]>;
  protected ticker: { [symbol: string]: Ticker };
  protected lastOnTimer: number;
  protected tickIsLocked = false;
  protected _callInstance: (method: string, data?: any, emitOnly?: boolean) => Promise<any>;
  protected setTimeouts: any[] = [];

  constructor(
    protected readonly accountId: string,
    protected readonly dataFeedFactory: DataFeedFactory,
    protected readonly exchange: CCXTService,
    protected readonly logger: PinoLogger | Logger,
    protected readonly systemLogger: PinoLogger,
    protected readonly keysStorage: ScriptExchangeKeysService,
    protected readonly eventEmitter: EventEmitter2,
    protected readonly cacheService: CacheService,
    protected readonly artifactsService: ScriptArtifactsService,
    protected readonly getSymbolInfo: (symbol: string) => any,
    protected readonly bundle: StrategyBundle,
    protected readonly key: string,
    protected readonly prefix: string = '',
    protected readonly apiCallLimitPerSecond: number = undefined,
    protected readonly developerAccess: boolean = false,
  ) {
    this.ordersBook = {};
    this.ticker = {};
    this.subscribers = new Map<string, number>();
    this.callbacks = new Map<string, ((args: any[], data?: any) => Promise<void>)[]>();
    this.lastOnTimer = 0;

    this.updateReport({});
  }

  public _log(level, ...args) {
    this.logger[level](args[1] ? args[1] : {}, args[0]);
    this.eventEmitter.emit('client.log', {
      accountId: this.accountId,
      processId: `${this.key}`,
      artifacts: this.getArtifactsKey(),
      level,
      message: args[0] ?? '',
    });
  }

  public systemLog(...args) {
    this.systemLogger.info(args[1] ? args[1] : {}, args[0]);
  }

  public debug(...args) {
    this._log('debug', args);
  }

  public info(...args) {
    this._log('info', args);
  }

  public warning(...args) {
    this._log('warn', args);
  }

  public error(...args) {
    this._log('error', args);
  }

  public require(file: string) {}

  public isTester(): boolean {
    return ['tester', 'tester-sync'].indexOf(process.env.NODE_ENV) > -1;
  }

  protected _hasDeveloperAccess(): boolean {
    return this.developerAccess;
  }

  public subscribeDataFeeds() {
    const { symbols, connectionName, interval } = this.args;
    const [symbol] = symbols;

    symbols.map((item) => {
      this.subscribers.set(
        `orders::${item}`,
        this.dataFeedFactory.subscribeOrders(connectionName, item, this.keys, (data) => {
          if (data.length && data.length > 0) {
            return this._callInstance('runOnOrderChange', data);
          }
        }),
      );
      this.subscribers.set(
        `ticker::${item}`,
        this.dataFeedFactory.subscribeTicker(connectionName, item, (data) => {
          this._tickerUpdate(item, data);
          if (item !== symbol) return;

          if (!interval) {
            return this._callInstance('runOnTick', data);
          }

          if (data.timestamp >= this.lastOnTimer + interval * 1000) {
            this.lastOnTimer = data.timestamp;
            return this._callInstance('runOnTimer');
          }
        }),
      );
      this.subscribers.set(
        `orders-book::${item}`,
        this.dataFeedFactory.subscribeOrdersBook(connectionName, item, (data) => {
          this.ordersBook[item] = {
            bids: data.bids.slice(0, 5),
            asks: data.asks.slice(0, 5),
          };
        }),
      );
    });
  }

  public unsubscribeDataFeeds() {
    this.setTimeouts.filter((timeout) => timeout._destroyed === false).map(clearTimeout);

    const { symbols, connectionName } = this.args;
    symbols.map((item) => {
      this.dataFeedFactory.unsubscribeOrders(connectionName, item, this.keys, this.subscribers.get(`orders::${item}`));
      this.dataFeedFactory.unsubscribeTicker(connectionName, item, this.subscribers.get(`ticker::${item}`));
      this.dataFeedFactory.unsubscribeOrdersBook(connectionName, item, this.subscribers.get(`orders-book::${item}`));
    });
  }

  protected _call(method: string, args: any[]) {
    const { connectionName } = this.args;
    const sdk: Exchange = this.exchange.getSDK(connectionName, this.keys);
    const internalMethod = method === 'getHistory' ? 'fetchOHLCV' : method;

    try {
      const result = sdk[internalMethod](...args);
      if (!this.isTester()) {
        this.logger.info({ method, args: JSON.stringify(args), result: JSON.stringify(result) }, 'SDK call');
      }
      this.runCallback(method, args, result);
      return result;
    } catch (e) {
      e.cause = ExceptionReasonType.UserScript;
      e.key = this.key;
      e.logger = this.logger;
      throw e;
    }
  }

  protected _updateOrder(method: 'editOrder' | 'cancelOrder', ...args: any[]) {
    const [orderId, ...rest] = args;
    return this._call(method, [orderId, ...rest]);
  }

  public modifyOrder(...args: any[]) {
    return this._updateOrder('editOrder', ...args);
  }

  public cancelOrder(...args: any[]) {
    return this._updateOrder('cancelOrder', ...args);
  }

  public ask(symbol: string = undefined, index = 0) {
    if (this.isTester()) {
      const { marketOrderSpread, pricePrecision } = this.exchange.getConfig();
      return parseFloat((this.close(symbol) * (1 - marketOrderSpread)).toFixed(pricePrecision));
    }

    return this._ordersBookValue(symbol, 'asks', index);
  }

  public bid(symbol: string = undefined, index = 0) {
    if (this.isTester()) {
      const { marketOrderSpread, pricePrecision } = this.exchange.getConfig();
      return parseFloat((this.close(symbol) * (1 + marketOrderSpread)).toFixed(pricePrecision));
    }

    return this._ordersBookValue(symbol, 'bids', index);
  }

  public getProfit() {
    // @ts-ignore
    return this.exchange.getSDK(this.args.connectionName, this.keys).getProfit();
  }

  public getFee() {
    // @ts-ignore
    return this.exchange.getSDK(this.args.connectionName, this.keys).getFee();
  }

  public registerCallback(method: string, callback: (data?: any) => Promise<void>) {
    if (!this.callbacks.has(method)) {
      this.callbacks.set(method, []);
    }

    const items = this.callbacks.get(method);
    items.push(callback);
  }

  protected runCallback(method: string, args: any[], data?: any): void | Promise<void> {
    if (!this.callbacks.has(method)) {
      return;
    }

    const items = this.callbacks.get(method);
    for (const callback of items) {
      callback(args, data);
    }
  }

  public ccxt() {
    if (!this._hasDeveloperAccess()) throw new Error('Invalid method ccxt().');

    return this.exchange.getSDK(this.args.connectionName, this.keys);
  }

  protected _sdkObject() {
    if (!this._hasDeveloperAccess()) throw new Error('Invalid method sdkGetProp() / sdkSetProp() / sdkCall().');

    return this.exchange.getSDK(this.args.connectionName, this.keys);
  }

  public sdkCall(method: string, args: any[]) {
    return this._sdkObject()[method](...args);
  }

  public sdkGetProp(property: string) {
    return this._sdkObject()[property];
  }

  public sdkSetProp(property: string, value: any) {
    this._sdkObject()[property] = value;
  }

  // public setPositionMode(value: boolean) {
  //
  // }
  public getArtifactsKey() {
    return this.isTester()
      ? process.env.TESTER_OPTIMIZE_ARTIFACTS
      : ScriptArtifactsService.createArtifactsKey([this.getId(), 'runtime']);
  }

  public updateReport(artifacts) {
    this.artifactsService.save(this.getArtifactsKey(), artifacts);
  }

  public getCurrentTime(): number {
    return this.exchange.getCurrentTime();
  }

  public async axios(config: AxiosRequestConfig, ...args: any[]) {
    let httpsAgent: SocksProxyAgent = undefined;
    if (!!process.env.CCXT_PROXY) {
      httpsAgent = new SocksProxyAgent(process.env.CCXT_PROXY);
    }

    try {
      // @ts-expect-error
      return await axios({ httpsAgent, ...config }, ...args);
    } catch (e) {
      e.cause = ExceptionReasonType.UserScript;
      e.key = this.key;
      e.logger = this.logger;
      throw e;
    }
  }

  public async getCache(...args) {
    try {
      // @ts-ignore
      return await this.cacheService.get(...args);
    } catch (e) {
      this.error(e.message, { stack: e.stack?.split('\n') });
    }
  }

  public async setCache(...args) {
    try {
      // @ts-ignore
      return await this.cacheService.set(...args);
    } catch (e) {
      this.error(e.message, { stack: e.stack?.split('\n') });
    }
  }

  public getErrorTrace(stack) {
    const { sourceMap, getStackTrace } = this.bundle;
    return getStackTrace(sourceMap, stack);
  }

  public prepareStackTrace(error, structuredStackTrace: NodeJS.CallSite[]) {
    const { sourceMap, getStackTrace } = this.bundle;
    const errorsStack: string[] = structuredStackTrace.map((call) => {
      return getStackTrace(
        sourceMap,
        `  at ${call.getFunctionName()} (${call.getFileName()}:${call.getLineNumber()}:${call.getColumnNumber()})`,
      );
    });

    return error + ':\n' + errorsStack.join('\n');
  }

  public async getOpenOrders(...args: any[]): Promise<OrderInterface[]> {
    const [symbol, ...rest] = args;
    return await this._call('fetchOpenOrders', [symbol, ...rest]);
  }

  public async getClosedOrders(...args: any[]): Promise<OrderInterface[]> {
    const [symbol, ...rest] = args;
    return await this._call('fetchClosedOrders', [symbol, ...rest]);
  }

  public getPositions(symbols: string[], ...args: any[]): OrderInterface[] | Promise<OrderInterface[]> {
    const [...rest] = args;
    return this._call('fetchPositions', [symbols, ...rest]);
  }

  public getBalance(params = {}): Balance | Promise<Balance> {
    return this._call('fetchBalance', [params]);
  }

  public getHistory(symbol, ...args: any[]): number[] | Promise<number[]> {
    const [...rest] = args;
    return this._call('getHistory', [symbol, ...rest]);
  }

  public setLeverage(leverage: number, symbol: string): any | Promise<any> {
    return this._call('setLeverage', [leverage, symbol]);
  }

  getId() {
    return this.key;
  }

  getUserId() {
    return this.accountId;
  }

  getPrefix() {
    return this.prefix.toString();
  }

  _ordersBookValue(symbol: string = undefined, arg: 'bids' | 'asks', index: number) {
    let valueSymbol: string = symbol;
    if (!symbol) {
      valueSymbol = this.args?.symbols[0];
    }

    return this.ordersBook[valueSymbol]?.[arg][index];
  }

  _tickerUpdate(symbol: string, data: Ticker) {
    this.ticker[symbol] = data;

    if (!this.ticker[symbol].timestamp) {
      this.ticker[symbol].timestamp = Date.now();
    }
  }

  _tickerValue(symbol: string = undefined, arg: string) {
    let valueSymbol: string = symbol;
    if (!symbol) {
      valueSymbol = this.args?.symbols?.[0];
    }

    return this.ticker[valueSymbol]?.[arg];
  }

  setTimeout(callback: (tms: number) => void, timeout: number) {
    if (this.isTester()) return;

    this.setTimeouts = this.setTimeouts.filter((timer) => timer._destroyed === false);
    this.setTimeouts.push(setTimeout(callback, timeout));
  }

  forceStop() {
    if (this.isTester()) {
      // @ts-ignore
      process.emit('message', 'force-stop');
      return;
    }

    this.eventEmitter.emit('process.force-stop', { id: parseInt(this.getId()), accountId: this.accountId });
  }

  tms(symbol: string = undefined) {
    return this._tickerValue(symbol, 'timestamp');
  }

  open(symbol: string = undefined) {
    return this._tickerValue(symbol, 'open');
  }

  high(symbol: string = undefined) {
    return this._tickerValue(symbol, 'high');
  }

  low(symbol: string = undefined) {
    return this._tickerValue(symbol, 'low');
  }

  close(symbol: string = undefined) {
    return this._tickerValue(symbol, 'close');
  }

  volume(symbol: string = undefined) {
    return this._tickerValue(symbol, 'quoteVolume');
  }

  loadTickers() {}
}
