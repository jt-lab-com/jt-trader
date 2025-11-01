import { nanoid } from 'nanoid';
import { MarketType, Strategy as ServerResponseStrategy } from '@packages/types';
import { StrategyItem } from '../types';
import { ScriptProcessContext } from './script-process-context';
import { DataFeed, DatafeedSubscriber } from '../../data-feed/data-feed';

export class SystemProcessContext extends ScriptProcessContext {
  private systemDataFeedSubscribeId: string;

  constructor(...args) {
    // @ts-ignore
    super(...args);
  }

  subscribeDataFeeds() {
    return; //System should subscribe to all data by itself
    // super.subscribeDataFeeds();
    //
    // this.subscribeAllDataFeeds();
  }
  subscribeAllDataFeeds() {
    const subscriber = (data, method, exchangeName, marketType) => {
      return this._callInstance('runOnDataFeedEvent', { data, method, connectionName: exchangeName, marketType });
    };
    this.systemDataFeedSubscribeId = this.dataFeedFactory.subscribeAllDataFeeds(subscriber);
  }

  subscribeDataFeedDynamic(
    method: string,
    exchange: string,
    marketType: MarketType,
    symbol: string,
    keys?: { apiKey: string; secret: string; password?: string; sandboxMode?: boolean },
  ): { subscribeId: number; subscriptionKey: string } {
    // Создаем subscriptionKey в зависимости от типа подписки
    const subscriptionKey = `${method}-dynamic::${exchange}::${marketType}::${symbol}`;

    // Проверяем, не подписан ли уже
    if (this.subscribers.has(subscriptionKey)) {
      this.warning(`Already subscribed: ${subscriptionKey}`);
      const existingId = this.subscribers.get(subscriptionKey);
      return { subscribeId: existingId, subscriptionKey };
    }

    const subscriber = (data: any, method: string, exchangeName: string, marketType: MarketType) => {
      return this._callInstance('runOnDataFeedEvent', { data, method, connectionName: exchangeName, marketType });
    };

    let subscribeId: number;

    // Выбираем правильный метод подписки в зависимости от method
    switch (method) {
      case 'watchOrderBook': {
        if (typeof symbol !== 'string') {
          throw new Error('watchOrderBook requires string symbol');
        }
        subscribeId = this.dataFeedFactory.subscribeOrdersBook(exchange, marketType, symbol, subscriber);
        break;
      }

      case 'watchTicker': {
        if (typeof symbol !== 'string') {
          throw new Error('watchTicker requires string symbol');
        }
        subscribeId = this.dataFeedFactory.subscribeTicker(exchange, marketType, symbol, subscriber);
        break;
      }

      case 'watchOrders': {
        if (typeof symbol !== 'string') {
          throw new Error('watchOrders requires string symbol');
        }
        if (!keys) {
          throw new Error('watchOrders requires API keys');
        }
        subscribeId = this.dataFeedFactory.subscribeOrders(exchange, marketType, symbol, keys, subscriber);
        break;
      }

      case 'watchPositions': {
        if (!Array.isArray(symbol)) {
          throw new Error('watchPositions requires array of symbols');
        }
        if (!keys) {
          throw new Error('watchPositions requires API keys');
        }
        subscribeId = this.dataFeedFactory.subscribePositions(exchange, marketType, symbol, keys, subscriber);
        break;
      }

      case 'watchBalance': {
        if (!keys) {
          throw new Error('watchBalance requires API keys');
        }
        subscribeId = this.dataFeedFactory.subscribeBalance(exchange, marketType, keys, subscriber);
        break;
      }

      default:
        throw new Error(
          `Unsupported method: ${method}. Supported: watchOrderBook, watchTicker, watchOrders, watchPositions, watchBalance`,
        );
    }

    // Сохраняем subscribeId в subscribers Map
    this.subscribers.set(subscriptionKey, subscribeId);

    this.logger.info(
      { subscriptionKey, subscribeId, method, exchange, marketType, symbol },
      'subscribeDynamic - Subscribed dynamic data feed',
    );

    return { subscribeId, subscriptionKey };
  }

  unsubscribeDataFeedDynamic(
    method: string,
    exchange: string,
    marketType: MarketType,
    symbol: string,
    keys?: { apiKey: string; secret: string; password?: string; sandboxMode?: boolean },
  ): any {
    // Создаем subscriptionKey таким же образом, как при подписке

    const subscriptionKey = `${method}-dynamic::${exchange}::${marketType}::${symbol}`;

    const subscribeId = this.subscribers.get(subscriptionKey);

    const result = { status: 'ok', message: '' };
    if (!subscribeId) {
      result.status = 'error';
      result.message = `Subscription not found: ${subscriptionKey}`;
      this.warning(`Subscription not found: ${subscriptionKey}`);
      return result;
    }

    // Выбираем правильный метод отписки в зависимости от method
    switch (method) {
      case 'watchOrderBook': {
        if (typeof symbol !== 'string') {
          throw new Error('watchOrderBook requires string symbol');
        }
        this.dataFeedFactory.unsubscribeOrdersBook(exchange, marketType, symbol, subscribeId);

        break;
      }

      case 'watchTicker': {
        if (typeof symbol !== 'string') {
          throw new Error('watchTicker requires string symbol');
        }
        this.dataFeedFactory.unsubscribeTicker(exchange, marketType, symbol, subscribeId);
        break;
      }

      case 'watchOrders': {
        if (typeof symbol !== 'string') {
          throw new Error('watchOrders requires string symbol');
        }
        // Используем this.keys из контекста
        if (!this.keys) {
          throw new Error('unsubscribeDynamic for watchOrders requires API keys in context');
        }
        this.dataFeedFactory.unsubscribeOrders(exchange, marketType, symbol, keys, subscribeId);
        break;
      }

      case 'watchPositions': {
        if (!Array.isArray(symbol)) {
          throw new Error('watchPositions requires array of symbols');
        }
        // Используем this.keys из контекста
        if (!this.keys) {
          throw new Error('unsubscribeDynamic for watchPositions requires API keys in context');
        }
        this.dataFeedFactory.unsubscribePositions(exchange, marketType, symbol, this.keys, subscribeId);
        break;
      }

      case 'watchBalance': {
        // Используем this.keys из контекста
        if (!this.keys) {
          throw new Error('unsubscribeDynamic for watchBalance requires API keys in context');
        }
        this.dataFeedFactory.unsubscribeBalance(exchange, marketType, this.keys, subscribeId);
        break;
      }

      default:
        throw new Error(
          `Unsupported method: ${method}. Supported: watchOrderBook, watchTicker, watchOrders, watchPositions, watchBalance`,
        );
    }

    // Удаляем из subscribers Map
    this.subscribers.delete(subscriptionKey);

    this.logger.info(
      { subscriptionKey, subscribeId, method, exchange, marketType, symbol },
      'unsubscribeDynamic - Unsubscribed dynamic data feed',
    );

    return result;
  }

  unsubscribeDataFeeds() {
    super.unsubscribeDataFeeds();
    if (this.systemDataFeedSubscribeId) {
      this.dataFeedFactory.unsubscribeAllDataFeeds(this.systemDataFeedSubscribeId);
    }
  }

  public async getStrategies(): Promise<StrategyItem[]> {
    const result: StrategyItem[] = [];
    const local = (await this.eventBus.emitAsync<ServerResponseStrategy[]>('system-script.get-strategies'))?.[0];

    for (const strategy of local) {
      result.push({
        id: strategy.id,
        name: strategy.name,
        version: strategy.version,
        type: 'local',
        path: strategy.path,
        mode: strategy.mode,
      });
    }

    try {
      const remote = (
        await this.eventBus.emitAsync<{ bundles: ServerResponseStrategy[]; appBundles: ServerResponseStrategy[] }>(
          'system-script.get-remote-bundles',
        )
      )?.[0];
      const remoteStrategies = [...Object.values(remote.bundles), ...Object.values(remote.appBundles)];

      for (const strategy of remoteStrategies) {
        result.push({
          id: strategy.id,
          name: strategy.name,
          version: strategy.version,
          type: strategy.type,
          path: strategy.path,
          mode: strategy.mode,
        });
      }
    } catch (e) {
      this.logger.error(e);
    }

    return result;
  }

  createRuntime = async (
    name: string,
    strategy: StrategyItem,
    exchange: string,
    marketType: MarketType,
    args: object,
    prefix?: string,
  ): Promise<string> => {
    prefix = prefix ?? nanoid(8);
    const result = await this.eventBus.emitAsync<string>(
      'system-script.add-runtime',
      this.accountId,
      name,
      prefix,
      strategy,
      args,
      'market',
      exchange,
      marketType,
    );

    return result[0];
  };

  updateRuntime = (
    id: string,
    name: string,
    strategy: StrategyItem,
    exchange: string,
    marketType: MarketType,
    args: object,
    prefix: string,
  ): void => {
    this.eventBus.emit(
      'system-script.update-runtime',
      this.accountId,
      id,
      name,
      prefix,
      strategy,
      args,
      'market',
      exchange,
      marketType,
    );
  };

  startRuntime = (id: string) => {
    this.eventBus.emit('system-script.run', id);
  };

  stopRuntime = (id: string) => {
    this.eventBus.emit('system-script.stop', id, true);
  };

  getRuntimeList = async () => {
    return (await this.eventBus.emitAsync('system-script.get-runtime-list'))?.[0];
  };
}
