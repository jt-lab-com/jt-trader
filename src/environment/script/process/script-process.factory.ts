import { Injectable } from '@nestjs/common';
import { ScriptProcessContext } from './script-process-context';
import { ScriptProcess } from './script-process';
import { ScriptStorageService } from '../storage/script-storage.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { DataFeedFactory } from '../../data-feed/data-feed.factory';
import { CCXTService } from '../../exchange/ccxt.service';
import { ScriptExchangeKeysService } from '../storage/script-exchange-keys.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs';
import { CacheService } from '../../../common/cache/cache.service';
import { Runtime } from '@prisma/client';
import { ScriptArtifactsService } from '../artifacts/script-artifacts.service';
import { ScriptBundlerService, StrategyBundle } from '../bundler/script-bundler.service';
import pino, { Logger } from 'pino';
import * as path from 'path';
import { ExceptionReasonType } from '../../../exception/types';
import { ScriptProcessContextSync } from './script-process-context-sync';
import { AccountService } from '../../account/account.service';
import { ACCOUNT_DEVELOPER_ACCESS, ACCOUNT_LIMIT_API_CALL_PER_SEC, ACCOUNT_LIMIT_RUNTIMES } from '../../account/const';
import { StrategyItem } from '../types';
import { nanoid } from 'nanoid';
import { StrategyArgsType } from '../../exchange/interface/strategy.interface';

interface Process {
  process: ScriptProcess;
  meta: ProcessMeta | { isEnabled: boolean };
  bundle: StrategyBundle;
}

export interface ProcessMeta extends Runtime {
  isEnabled: boolean;
}

@Injectable()
export class ScriptProcessFactory {
  private readonly processes: Map<number, Process>;
  private markets: any[];
  static readonly monitoringInterval: number = 5000;
  private runtimeLogger: Map<string, Logger>;

  constructor(
    private readonly dataFeedFactory: DataFeedFactory,
    private readonly exchange: CCXTService,
    private readonly storage: ScriptStorageService,
    private readonly scriptBundler: ScriptBundlerService,
    private readonly keysStorage: ScriptExchangeKeysService,
    private readonly eventEmitter: EventEmitter2,
    private readonly cacheService: CacheService,
    private readonly artifactsService: ScriptArtifactsService,
    private readonly accountService: AccountService,
    @InjectPinoLogger(ScriptProcessFactory.name) private readonly logger: PinoLogger,
  ) {
    this.processes = new Map([]);
    this.runtimeLogger = new Map([]);
    // this.monitoring();
    this.markets = JSON.parse(fs.readFileSync(process.env.MARKETS_FILE_PATH).toString());
  }

  getSymbolInfo = (symbol: string) => {
    const formattedSymbol = symbol.replace(':USDT', '').replace('/', '');
    return this.markets.find(({ id }) => id === formattedSymbol);
  };

  private async processesLimit(accountId: string): Promise<boolean> {
    const enabledProcessesLimit: number = parseInt(
      await this.accountService.getParam(accountId, ACCOUNT_LIMIT_RUNTIMES),
    );
    let counter = 0;
    this.processes.forEach((item) => {
      counter += item.meta.isEnabled ? 1 : 0;
    });

    return counter >= enabledProcessesLimit;
  }

  async register(key: number, args: { [key: string]: any } = {}): Promise<void> {
    const meta = await this.storage.getRuntimeById(key);
    if (!meta) {
      this.logger.error(`Invalid strategy ${key}`);
      return;
    }
    const logger = this.getRuntimeLogger(key.toString());

    const metaArgs = [...meta.args, { key: 'connectionName', value: meta.exchange }].reduce(
      // @ts-ignore  //ignore because args is string of type Runtime
      (acc, { key, value }) => ({ ...acc, [key]: value }),
      {},
    );

    if (this.check(key)) {
      throw { message: 'Process already registered', cause: ExceptionReasonType.ScriptAlreadyRegistered };
    }
    if (await this.processesLimit(meta.accountId)) {
      const e: any = new Error('Runtime processes limit reached');
      e.cause = ExceptionReasonType.RuntimeScriptLimit;
      e.key = key;
      e.logger = logger;
      throw e;
    }

    const bundle = await this.scriptBundler.generateBundle(meta.accountId, key.toString(), meta.strategy);
    if (bundle.warn) {
      logger.warn(bundle.warn);
    }
    const apiCallLimitPerSecond: number = parseInt(
      await this.accountService.getParam(meta.accountId, ACCOUNT_LIMIT_API_CALL_PER_SEC),
    );
    const developerAccess: boolean =
      (await this.accountService.getParam(meta.accountId, ACCOUNT_DEVELOPER_ACCESS)) === 'true';
    try {
      const context = new ScriptProcessContext(
        meta.accountId,
        this.dataFeedFactory,
        this.exchange,
        logger,
        this.logger,
        this.keysStorage,
        this.eventEmitter,
        this.cacheService,
        this.artifactsService,
        this.getSymbolInfo,
        bundle,
        key.toString(),
        meta.prefix,
        apiCallLimitPerSecond,
        developerAccess,
      );

      const scriptProcess = new ScriptProcess(context, { ...metaArgs, ...args });
      this.processes.set(key, { process: scriptProcess, meta: { ...meta, isEnabled: false }, bundle });
      await scriptProcess.init(bundle);
      await scriptProcess.start();
      this.processes.set(key, { process: scriptProcess, meta: { ...meta, isEnabled: true }, bundle });
    } catch (e) {
      e.cause = ExceptionReasonType.UserScript;
      e.logger = logger;
      e.key = key;

      this.eventEmitter.emit('client.notification', {
        accountId: meta.accountId,
        message: 'Error starting bot. See logs for details.',
        type: 'error',
      });

      throw e;
    }
  }

  async createPreviewExecution(accountId: string, strategy: StrategyItem, args: object): Promise<string> {
    const key = nanoid(8);
    const prefix = `${key}-preview`;
    const logger = this.getRuntimeLogger(key.toString());
    const bundle = await this.scriptBundler.generatePreviewExecutionBundle(accountId, key, strategy);
    const context = new ScriptProcessContext(
      accountId,
      this.dataFeedFactory,
      this.exchange,
      logger,
      this.logger,
      this.keysStorage,
      this.eventEmitter,
      this.cacheService,
      this.artifactsService,
      this.getSymbolInfo,
      bundle,
      key.toString(),
      prefix,
      2,
      false,
    );

    if (!!args['exchange']) {
      args['connectionName'] = args['exchange'];
      delete args['exchange'];
    }

    const scriptProcess = new ScriptProcess(context, args);
    return scriptProcess.previewExecution(bundle, args as StrategyArgsType);
  }

  async registerTest(id: number, args: { [key: string]: any } = {}): Promise<void> {
    if (this.check(id)) {
      throw { message: 'Process already registered', reason: ExceptionReasonType.ScriptAlreadyRegistered };
    }

    const meta = await this.storage.getScenarioBySetId(id);
    const bundle = await this.scriptBundler.generateBundle(meta.accountId, id.toString(), {
      ...meta.strategy,
      mode: 'tester',
    });
    if (bundle.warn) {
      this.logger.warn(bundle.warn);
    }

    const ContextClass = process.env.NODE_ENV === 'tester-sync' ? ScriptProcessContextSync : ScriptProcessContext;
    try {
      const context = new ContextClass(
        meta.accountId,
        this.dataFeedFactory,
        this.exchange,
        this.logger,
        this.logger,
        this.keysStorage,
        this.eventEmitter,
        this.cacheService,
        this.artifactsService,
        this.getSymbolInfo,
        bundle,
        id.toString(),
        id.toString(),
      );

      if (!!args['exchange']) {
        args['connectionName'] = args['exchange'];
        delete args['exchange'];
      }

      const scriptProcess = new ScriptProcess(context, { ...args });
      this.processes.set(id, { process: scriptProcess, meta: { isEnabled: false }, bundle });
      await scriptProcess.init(bundle);
      await scriptProcess.start();
      this.processes.set(id, { process: scriptProcess, meta: { isEnabled: true }, bundle });
    } catch (e) {
      e.cause = ExceptionReasonType.UserScript;
      e.key = id;
      e.logger = this.logger;
      throw e;
    }
  }

  public getProcessScriptBundle(id: number) {
    return this.processes.get(id)?.bundle;
  }

  check(key: number): boolean {
    return !!this.processes.get(key)?.meta.isEnabled;
  }

  async stop(key: number): Promise<void> {
    if (!this.processes.has(key)) return;

    const { process: scriptProcess } = this.processes.get(key);
    try {
      await scriptProcess.stop();
    } catch (e) {
      e.cause = ExceptionReasonType.UserScript;
      e.key = key;
      e.logger =
        ['tester', 'tester-sync'].indexOf(process.env.NODE_ENV) > -1
          ? this.logger
          : this.getRuntimeLogger(key.toString());
      throw e;
    }
    this.processes.delete(key);
  }

  async stopAll(remove: boolean): Promise<number[]> {
    const keys = [];
    await Promise.all(
      Array.from(this.processes, async ([key, { process: scriptProcess }]) => {
        keys.push(key);
        await this.stop(key);
        if (remove) this.processes.delete(key);
      }),
    );

    return keys;
  }

  async forceUpdateProcessArgs(key: number): Promise<void> {
    const { process: scriptProcess } = this.processes.get(key);
    const meta = await this.storage.getRuntimeById(key);

    // @ts-ignore  //ignore because args is string of type Runtime
    const metaArgs = meta.args.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {});
    try {
      await scriptProcess.updateArgs(metaArgs);
    } catch (e) {
      e.cause = ExceptionReasonType.UserScript;
      e.key = key;
      e.logger =
        ['tester', 'tester-sync'].indexOf(process.env.NODE_ENV) > -1
          ? this.logger
          : this.getRuntimeLogger(key.toString());
      throw e;
    }
  }

  async forceReportAction(key: number, action: string, payload: any): Promise<void> {
    const { process: scriptProcess } = this.processes.get(key);
    try {
      await scriptProcess.reportAction(action, payload);
    } catch (e) {
      e.cause = ExceptionReasonType.UserScript;
      e.key = key;
      e.logger = this.getRuntimeLogger(key.toString());
      throw e;
    }
  }

  public getRuntimeLogger(key: string): Logger {
    if (!this.runtimeLogger.has(key)) {
      const artifacts: string = ScriptArtifactsService.createArtifactsKey([key, 'runtime']);
      const targets = [
        {
          level: 'info',
          target: 'pino/file',
          options: {
            destination: path.join(process.env.LOGS_DIR_PATH, `${artifacts}.log`),
            sync: false,
            append: true,
            size: '1000B',
            interval: '2s',
            compress: 'gzip',
          },
        },
      ];
      if (process.env.ENV !== 'production') {
        //@ts-ignore
        targets.push({ level: 'debug', target: 'pino-pretty', options: { colorize: true } });
      }

      const options = {
        crlf: true,
        redact: { paths: ['pid', 'hostname', 'context'], remove: true },
        transport: { targets },
      };
      this.runtimeLogger.set(key, pino(options));
    }

    return this.runtimeLogger.get(key);
  }

  public getAllRuntimeLoggers(): Logger[] {
    return this.runtimeLogger ? Array.from(this.runtimeLogger.values()) : [];
  }

  private monitoring(): void {
    this.logger.info('Call Monitoring');
    if (this.processes.size > 0) {
      this.processes.forEach(({ process }, key: number) => {
        // TODO: логика мониторинга процессов
      });
    }
    setTimeout(() => {
      this.monitoring();
    }, ScriptProcessFactory.monitoringInterval);
  }
}
