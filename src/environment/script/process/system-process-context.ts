import { nanoid } from 'nanoid';
import { MarketType, Strategy as ServerResponseStrategy } from '@packages/types';
import { StrategyItem } from '../types';
import { ScriptProcessContext } from './script-process-context';

export class SystemProcessContext extends ScriptProcessContext {
  private systemDataFeedSubscribeId: string;

  constructor(...args) {
    // @ts-ignore
    super(...args);
  }

  subscribeDataFeeds() {
    super.subscribeDataFeeds();

    this.systemDataFeedSubscribeId = this.dataFeedFactory.subscribeAllDataFeeds((data, exchangeName, marketType) => {
      return this._callInstance('runOnDataFeedEvent', { data, connectionName: exchangeName, marketType });
    });
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
