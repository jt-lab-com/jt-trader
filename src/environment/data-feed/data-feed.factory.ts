import { Injectable } from '@nestjs/common';
import { DataFeed, DatafeedSubscriber } from './data-feed';
import { Balance, Order, OrderBook, Position, Ticker, Trade } from 'ccxt';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { CCXTService } from '../exchange/ccxt.service';
import { ExchangeKeysType } from '../../common/interface/exchange-sdk.interface';
import { CacheService } from '../../common/cache/cache.service';
import { MarketType } from '@packages/types';
import { nanoid } from 'nanoid';

type DataFeedType = OrderBook | Trade | Ticker | Order[] | Balance | Position[];

@Injectable()
export class DataFeedFactory {
  private dataFeeds: Map<string, DataFeed<DataFeedType>>;
  // private systemScriptSubscribers: DatafeedSubscriber<DataFeedType>[];
  // private systemScriptSubscribers: Array<{
  //   subscriber: DatafeedSubscriber<DataFeedType>;
  //   subscribesInfo: Array<{ dataFeedKey: string, subscribeId: number; }>;
  // }>;
  private systemScriptSubscribers: Map<
    string,
    {
      subscriber: DatafeedSubscriber<DataFeedType>;
      subscribesInfo: Array<{ dataFeedKey: string; subscribeId: number }>;
    }
  >;
  private dataFlow: 'subscriber' | 'awaiter';
  private dataProxyMode: boolean;

  constructor(
    @InjectPinoLogger(DataFeedFactory.name) private readonly logger: PinoLogger,
    private readonly sdk: CCXTService,
    private readonly cacheService: CacheService,
  ) {
    this.dataFeeds = new Map<string, DataFeed<DataFeedType>>();
    this.systemScriptSubscribers = new Map();
    this.dataFlow = 'awaiter';
    this.dataProxyMode = process.env.DATA_PROXY_MODE === '1';
    setInterval(this.monitoring, 5 * 1000);
  }

  setDataFlow(dataFlow: 'subscriber' | 'awaiter'): void {
    this.dataFlow = dataFlow;
  }

  private selectDataFeed(
    args: [string, MarketType, string, string | string[], string, string, string, ...any],
  ): DataFeed<DataFeedType> {
    const [exchange, marketType, method, symbol, apiKey, secret, password, sandboxMode, ...rest] = args;
    const key: string = [exchange, method, Array.isArray(symbol) ? JSON.stringify(symbol) : symbol, apiKey].join('::');

    const isMock: boolean = exchange.endsWith('-mock');
    let dataFlow = this.dataFlow;
    // если биржа mock и приватный метод пользователя
    if (
      isMock &&
      ['watchOrderBook', 'watchTicker', 'watchOrders', 'watchPositions', 'watchBalance'].indexOf(method) === -1
    ) {
      dataFlow = 'subscriber';
    }

    let dataFeed: DataFeed<DataFeedType> = this.dataFeeds.get(key);
    if (!dataFeed) {
      dataFeed = new DataFeed(
        this.sdk.getSDK(exchange, marketType, { apiKey, secret, password, sandboxMode }),
        [method, symbol, ...rest],
        this.logger,
        dataFlow,
      );
      this.dataFeeds.set(key, dataFeed);

      this.systemScriptSubscribers.forEach(({ subscriber, subscribesInfo }) => {
        const id = dataFeed.subscribe(subscriber);
        subscribesInfo.push({ dataFeedKey: key, subscribeId: id });
      });
    }

    return dataFeed;
  }

  public subscribeAllDataFeeds(subscriber: DatafeedSubscriber<DataFeedType>) {
    const key = nanoid(8);
    const subscribesInfo = [];

    for (const [dataFeedKey, dataFeed] of this.dataFeeds.entries()) {
      const id = dataFeed.subscribe(subscriber);
      subscribesInfo.push({ dataFeedKey, subscribeId: id });
    }

    this.systemScriptSubscribers.set(key, { subscriber, subscribesInfo });

    return key;
  }

  public unsubscribeAllDataFeeds(key: string): boolean {
    const subscriberData = this.systemScriptSubscribers.get(key);
    if (!subscriberData) return false;

    for (const { dataFeedKey, subscribeId } of subscriberData.subscribesInfo) {
      const dataFeed = this.dataFeeds.get(dataFeedKey);
      dataFeed.unsubscribe(subscribeId);
    }

    return true;
  }

  public subscribeTicker(
    exchange: string,
    marketType: MarketType,
    symbol: string,
    subscriber: DatafeedSubscriber<Ticker>,
  ): number {
    if (!this.dataProxyMode) {
      return this.subscribeTickerNative(exchange, marketType, symbol, subscriber);
    }

    const key = `${exchange.toUpperCase()}::${marketType.toUpperCase()}::TICKER::${symbol.toUpperCase()}`;
    const id = this.cacheService.subscribe(key, (data) => {
      void subscriber(JSON.parse(data), 'watchTicker', exchange, marketType);
    });
    this.cacheService.publish('SUBSCRIBE_QUOTES', key).catch((e) => {
      this.logger.error({ e, key }, 'DataProxy subscribe error');
    });
    return id;
  }

  public subscribeTickerNative(
    exchange: string,
    marketType: MarketType,
    symbol: string,
    subscriber: DatafeedSubscriber<Ticker>,
  ): number {
    const dataFeed = this.selectDataFeed([exchange, marketType, 'watchTicker', symbol, '', '', '', false]);
    return dataFeed.subscribe(subscriber);
  }

  public unsubscribeTickerNative(exchange: string, marketType: MarketType, symbol: string, subscriberId: number): void {
    const dataFeed = this.selectDataFeed([exchange, marketType, 'watchTicker', symbol, '', '', '', false]);
    dataFeed.unsubscribe(subscriberId);
  }

  public unsubscribeTicker(exchange: string, marketType: MarketType, symbol: string, subscriberId: number): void {
    if (!this.dataProxyMode) {
      return this.unsubscribeTickerNative(exchange, marketType, symbol, subscriberId);
    }

    this.cacheService.unsubscribe(subscriberId);
  }

  public subscribeOrdersBook(
    exchange: string,
    marketType: MarketType,
    symbol: string,
    subscriber: DatafeedSubscriber<OrderBook>,
  ): number {
    if (!this.dataProxyMode) {
      return this.subscribeOrdersBookNative(exchange, marketType, symbol, subscriber);
    }

    const key = `${exchange.toUpperCase()}::${marketType.toUpperCase()}::ORDERS-BOOK::${symbol.toUpperCase()}`;
    const id = this.cacheService.subscribe(key, (data) => {
      void subscriber(JSON.parse(data), 'watchOrderBook', exchange, marketType);
    });
    this.cacheService.publish('SUBSCRIBE_QUOTES', key).catch((e) => {
      this.logger.error({ e, key }, 'DataProxy subscribe error');
    });
    return id;
  }

  public subscribeOrdersBookNative(
    exchange: string,
    marketType: MarketType,
    symbol: string,
    subscriber: DatafeedSubscriber<OrderBook>,
  ): number {
    const dataFeed = this.selectDataFeed([exchange, marketType, 'watchOrderBook', symbol, '', '', '', false]);
    return dataFeed.subscribe(subscriber);
  }

  public unsubscribeOrdersBook(exchange: string, marketType: MarketType, symbol: string, subscriberId: number): void {
    if (!this.dataProxyMode) {
      return this.unsubscribeOrdersBookNative(exchange, marketType, symbol, subscriberId);
    }

    this.cacheService.unsubscribe(subscriberId);
  }

  public unsubscribeOrdersBookNative(
    exchange: string,
    marketType: MarketType,
    symbol: string,
    subscriberId: number,
  ): void {
    const dataFeed = this.selectDataFeed([exchange, marketType, 'watchOrderBook', symbol, '', '', '', false]);
    dataFeed.unsubscribe(subscriberId);
  }

  public subscribeOrders(
    exchange: string,
    marketType: MarketType,
    symbol: string,
    keys: ExchangeKeysType | null,
    subscriber: DatafeedSubscriber<Order[]>,
  ): number {
    const dataFeed = this.selectDataFeed([
      exchange,
      marketType,
      'watchOrders',
      symbol,
      keys.apiKey,
      keys.secret,
      keys.password,
      keys.sandboxMode,
    ]);
    return dataFeed.subscribe(subscriber);
  }

  public unsubscribeOrders(
    exchange: string,
    marketType: MarketType,
    symbol: string,
    keys: ExchangeKeysType | null,
    subscriberId: number,
  ): void {
    const dataFeed = this.selectDataFeed([
      exchange,
      marketType,
      'watchOrders',
      symbol,
      keys.apiKey,
      keys.secret,
      keys.password,
      keys.sandboxMode,
    ]);
    dataFeed.unsubscribe(subscriberId);
  }

  public subscribeBalance(
    exchange: string,
    marketType: MarketType,
    keys: ExchangeKeysType | null,
    subscriber: DatafeedSubscriber<Balance>,
  ): number {
    const dataFeed = this.selectDataFeed([
      exchange,
      marketType,
      'watchBalance',
      '',
      keys.apiKey,
      keys.secret,
      keys.password,
      keys.sandboxMode,
    ]);
    return dataFeed.subscribe(subscriber);
  }

  public unsubscribeBalance(
    exchange: string,
    marketType: MarketType,
    keys: ExchangeKeysType | null,
    subscriberId: number,
  ): void {
    const dataFeed = this.selectDataFeed([
      exchange,
      marketType,
      'watchBalance',
      '',
      keys.apiKey,
      keys.secret,
      keys.password,
      keys.sandboxMode,
    ]);
    dataFeed.unsubscribe(subscriberId);
  }

  public subscribePositions(
    exchange: string,
    marketType: MarketType,
    symbols: string[],
    keys: ExchangeKeysType | null,
    subscriber: DatafeedSubscriber<Position[]>,
  ): number {
    const dataFeed = this.selectDataFeed([
      exchange,
      marketType,
      'watchPositions',
      symbols,
      keys.apiKey,
      keys.secret,
      keys.password,
      keys.sandboxMode,
    ]);
    return dataFeed.subscribe(subscriber);
  }

  public unsubscribePositions(
    exchange: string,
    marketType: MarketType,
    symbols: string[],
    keys: ExchangeKeysType | null,
    subscriberId: number,
  ): void {
    const dataFeed = this.selectDataFeed([
      exchange,
      marketType,
      'watchPositions',
      symbols,
      keys.apiKey,
      keys.secret,
      keys.password,
      keys.sandboxMode,
    ]);
    dataFeed.unsubscribe(subscriberId);
  }

  public statusReport(): any[] {
    return Array.from(this.dataFeeds.entries()).map(([key, dataFeed]: [string, DataFeed<DataFeedType>]) => {
      return {
        exchange: dataFeed.exchange,
        method: dataFeed.method,
        subscribers: dataFeed.subscribersCnt,
        lastReceiveTms: dataFeed.lastReceiveTms,
        arguments: dataFeed.arguments?.map((arg) => arg.toString()).join('; '),
      };
    });
  }

  monitoring = () => {
    this.logger.debug(`Data Feeds counter: ${this.dataFeeds.size}`);
    if (!this.dataFeeds?.size) return;

    const now = Date.now();
    Array.from(this.dataFeeds.entries()).map(([key, dataFeed]: [string, DataFeed<DataFeedType>]) => {
      const { lastReceiveTms, isEmpty, isFailed, retry, nextRetryTms, method, retriesCounter } = dataFeed;
      if (isEmpty) {
        this.dataFeeds.delete(key);
        return;
      }

      const condition = dataFeed.isStopped && (!isFailed || nextRetryTms <= now);
      // if (!isFailed && ['watchOrderBook', 'watchTicker'].indexOf(method) > -1) {
      //   dataFeed.isStopped = lastReceiveTms > 0 && now - lastReceiveTms > MAX_RECEIVED_TIMEOUT; // перезапуск если давно не обновлялись данные
      // }

      if (!condition) {
        // this.logger.info({ nextRetryTms: new Date(nextRetryTms), }, 'No Condition',);
        return;
      }
      try {
        retry();
      } catch (e) {
        this.dataFeeds.delete(key);
        throw e;
      }
    });
  };
}
