import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ScriptProcessFactory } from './process/script-process.factory';
import { ScriptStorageService } from './storage/script-storage.service';
import { SiteApi } from '../../common/api/site-api';
import { StrategyItem } from './types';
import { StoreBundleResponse } from '../../common/api/types';
import { ExceptionReasonType } from '../../exception/types';
import { CacheService } from '../../common/cache/cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ScriptArtifactsService } from './artifacts/script-artifacts.service';
import { MarketType } from '@packages/types';

const ENABLED_RUNTIME_PREFIX = 'ENABLED_RUNTIME_PREFIX::';

@Injectable()
export class ScriptService {
  private runIsLocked = false;

  constructor(
    private readonly factory: ScriptProcessFactory,
    private readonly storage: ScriptStorageService,
    private readonly siteApi: SiteApi,
    private readonly cacheService: CacheService,
    private readonly eventEmitter: EventEmitter2,
    private readonly artifactsService: ScriptArtifactsService,
    @InjectPinoLogger(ScriptService.name) private readonly logger: PinoLogger,
  ) {
    // setInterval(async () => {
    //   const keys = await cacheService.keys(ENABLED_RUNTIME_PREFIX);
    //   logger.info(keys, 'Running Processes keys');
    // }, 5000);
  }

  async run(id: number) {
    if (this.runIsLocked) {
      const error: any = new Error('Process start is locked while another is starting');
      error.cause = ExceptionReasonType.ScriptAlreadyRegistered;
      throw error;
    }

    this.runIsLocked = true;
    try {
      await this.factory.register(id);
      await this.markProcess(id, true);
    } finally {
      this.runIsLocked = false;
      this.eventEmitter.emit('system.update-report');
    }
  }

  async stop(id: number, softMode = false) {
    await this.factory.stop(id);
    if (softMode) {
      await this.markProcess(id, false);
    }
    this.eventEmitter.emit('system.update-report');
  }

  async stopAll(remove = true, softMode = false) {
    const keys = await this.factory.stopAll(remove);
    await Promise.all(
      keys.map(async (key) => {
        await this.markProcess(key, false);
      }),
    );
    this.eventEmitter.emit('system.update-report');
  }

  async restoreRunningProcesses() {
    const keys = await this.cacheService.keys(ENABLED_RUNTIME_PREFIX);
    if (!keys || !keys.length) return;

    for (const key of keys) {
      const [id] = key.split('::').slice(-1);
      await this.run(parseInt(id));
    }
  }

  private async markProcess(id: number, isRunning: boolean) {
    const key = `${ENABLED_RUNTIME_PREFIX}${id}`;
    if (isRunning) {
      await this.cacheService.set(key, '1');
    } else {
      await this.cacheService.delete(key);
    }
  }

  getStrategiesList = this.storage.getStrategies;

  getStrategyContent = this.storage.getContent;

  getRuntimeList = async (accountId: string) =>
    (await this.storage.getRuntimeList(accountId)).map((item) => ({
      ...item,
      isEnabled: this.factory.check(item.id),
    }));

  addRuntime = async (
    accountId: string,
    name: string,
    prefix: string,
    strategy: StrategyItem,
    args: { key: string; value: string | number }[],
    runtimeType: 'market' | 'system',
    exchange: string,
    marketType: MarketType,
  ): Promise<number> => {
    return await this.storage.saveRuntime({
      accountId,
      name,
      prefix,
      exchange,
      strategy: strategy.name,
      strategyId: strategy.id,
      strategyType: strategy.type,
      strategyPath: strategy.path,
      args,
      runtimeType,
      marketType,
    });
  };

  updateRuntime = async (
    accountId: string,
    id: number,
    name: string,
    prefix: string,
    strategy: StrategyItem,
    args: { key: string; value: string | number }[],
    runtimeType: 'market' | 'system',
    exchange: string,
    marketType: MarketType,
  ): Promise<void> => {
    await this.storage.saveRuntime({
      accountId,
      id,
      name,
      prefix,
      exchange,
      strategy: strategy.name,
      strategyId: strategy.id,
      strategyType: strategy.type,
      strategyPath: strategy.path,
      args,
      runtimeType,
      marketType,
    });

    if (this.factory.check(id)) {
      await this.factory.forceUpdateProcessArgs(id);
    }
  };

  submitReportAction = async (accountId: string, artifacts: string, action: string, payload: any): Promise<void> => {
    const item = (await this.getRuntimeList(accountId))?.find((runtime) => runtime.artifacts === artifacts);
    if (!item) {
      return;
    }

    if (this.factory.check(item.id)) {
      await this.factory.forceReportAction(item.id, action, payload);
    }
  };

  removeRuntime = async (id: number): Promise<void> => {
    await this.storage.removeRuntime(id);
  };

  async getRemoteBundles(accountId: string) {
    const response = await this.siteApi.getBundles(accountId);

    const bundleMapper = (bundle: StoreBundleResponse) => ({
      id: bundle.id,
      name: bundle.name,
      version: bundle.version,
      definedArgs: bundle.defined_args,
      bundleName: bundle.bundleName,
      mode: bundle.mode,
    });

    return {
      bundles: response.bundles.map(bundleMapper),
      appBundles: response.app_bundles.map(bundleMapper),
    };
  }

  async previewExecution(accountId: string, strategy: StrategyItem, args: object): Promise<string | null> {
    const artifactsKey = await this.factory.createPreviewExecution(accountId, strategy, args);
    if (!artifactsKey) return null;

    const artifacts = this.artifactsService.read(artifactsKey);
    this.artifactsService.delete(artifactsKey);
    return artifacts;
  }
}
