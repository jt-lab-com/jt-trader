import { Injectable } from '@nestjs/common';
import { CCXTService } from '../exchange/ccxt.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ScriptProcessFactory } from '../script/process/script-process.factory';
import { ChildProcess, fork } from 'child_process';
import { ScenarioStatusType, ScriptScenarioStorageService } from '../script/storage/script-scenario-storage.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ScriptScenarioService } from '../script/scenario/script-scenario.service';
import { CacheService } from '../../common/cache/cache.service';
import { HistoryBarsService } from '../history-bars/history-bars.service';
import { AccountService } from '../account/account.service';
import {
  ACCOUNT_LIMIT_TESTER_EXEC_TIMEOUT,
  ACCOUNT_LIMIT_TESTER_MAX_MEMORY,
  ACCOUNT_LIMIT_TESTER_MAX_PROCESSES,
} from '../account/const';
import { StrategyItem } from '../script/types';
import { ExceptionReasonType } from '../../exception/types';
import { AxiosError } from 'axios';
import { ScriptBundlerService } from '../script/bundler/script-bundler.service';
import { ScriptArtifactsService } from '../script/artifacts/script-artifacts.service';
import { formatTesterSymbol } from './utils/format-tester-symbol';

type TaskType = {
  id: number;
  accountId: string;
  sync: boolean;
  strategy: StrategyItem;
  symbol: string;
  start: string;
  end: string;
  artifacts: string;
  set: { key: string; value: number }[];
  index: number;
};

type ResultType = {
  id: number;
  status: ScenarioStatusType;
};

@Injectable()
export class ScriptTesterService {
  private processes: Map<number, { child: ChildProcess; startTime: number; accountId: string }>;
  private currentScenario: { [key: number]: Map<number, boolean> };
  // private currentScenarioId: number;
  // private currentScenarioAccountId: string;
  private queue: TaskType[];
  private resultQueue: ResultType[];
  private maxChild: number;
  private maxMemory: number;
  private execTimeout: number;
  private disableArtifactsCache: boolean;

  constructor(
    private readonly exchange: CCXTService,
    private readonly scriptProcessFactory: ScriptProcessFactory,
    private readonly scenarioStorageService: ScriptScenarioStorageService,
    private readonly scenarioService: ScriptScenarioService,
    private readonly eventEmitter: EventEmitter2,
    private readonly cacheService: CacheService,
    private readonly historyBarsService: HistoryBarsService,
    private readonly accountService: AccountService,
    private readonly bundlerService: ScriptBundlerService,
    @InjectPinoLogger(ScriptTesterService.name) private readonly logger: PinoLogger,
  ) {
    this.maxChild = 0;
    this.maxMemory = 0;
    this.execTimeout = 0;
    this.processes = new Map();
    this.queue = [];
    this.resultQueue = [];
    this.currentScenario = {};
    this.disableArtifactsCache = process.env.DISABLE_TESTER_ARTIFACTS_CACHE === '1';

    setInterval(async () => {
      if (this.resultQueue.length === 0) return;
      while (this.resultQueue.length > 0) {
        const result = this.resultQueue.shift();
        await this.scenarioStorageService.updateStatus(result.id, result.status);
        this.eventEmitter.emit('client.update-tester-scenario-list');
      }
    }, 500);

    setInterval(async () => {
      if (this.processes.size < 1) {
        // if (!!this.currentScenario || !!this.currentScenarioId || !!this.currentScenarioAccountId) {
        //   this.currentScenario = undefined;
        //   this.currentScenarioId = undefined;
        //   this.currentScenarioAccountId = undefined;
        // }

        return;
      }
      const data = await Promise.all(
        Array.from(this.processes.entries()).map(async ([key, { accountId, child }]) => {
          return {
            accountId: accountId,
            data: await this.cacheService.get(`tester-scenario-set-${key}`),
          };
        }),
      );

      const toLog = data.reduce((acc, { accountId, data: json }) => {
        if (!json) return acc;
        try {
          const data = JSON.parse(json);
          const { pid, memory } = data;
          this.checkProcessLimits(parseInt(pid), parseInt(memory));
          if (!acc[accountId]) {
            acc[accountId] = [];
          }
          acc[accountId].push(data);
        } catch (e) {}
        return acc;
      }, {});
      Object.entries(toLog).forEach(([key, value]) =>
        this.eventEmitter.emit('client.tester-performance', { accountId: key, log: value }),
      );
    }, 1000);
  }

  async runWithParams(
    id: number,
    symbol: string,
    timeframe: number, // candle timeframe minutes
    startDate: Date,
    endDate: Date,
    params: {
      [key: string]: any;
    },
  ) {
    await this.exchange.setSource(symbol, timeframe.toString(), startDate, endDate);
    await this.scriptProcessFactory.registerTest(id, { ...params, timeframe, symbol, startDate, endDate });
  }

  async runScenarioInChild(scenarioId: number, sync: boolean) {
    const scenario = await this.scenarioStorageService.getScenario(scenarioId);

    try {
      require.resolve(process.env.CONSOLE_MODULE_PATH);
    } catch (e) {
      this.logger.error({ scenarioId, stack: e.stack?.split('\n') }, e.message);
      this.eventEmitter.emit('client.notification', {
        accountId: scenario.accountId,
        message: `invalid tester module \n${process.env.CONSOLE_MODULE_PATH}`,
        type: 'error',
      });
      return;
    }

    // if (!!this.currentScenarioId) {
    //   this.logger.error({ try: `${scenarioId}`, current: `${this.currentScenarioId}` }, 'can not start new scenario');
    //   this.eventEmitter.emit('client.notification', {
    //     accountId: scenario.accountId,
    //     message: 'unable to start another scenario',
    //     type: 'error',
    //   });
    //   return;
    // }

    this.maxChild = parseInt(
      await this.accountService.getParam(scenario.accountId, ACCOUNT_LIMIT_TESTER_MAX_PROCESSES),
    );
    this.maxMemory = parseInt(await this.accountService.getParam(scenario.accountId, ACCOUNT_LIMIT_TESTER_MAX_MEMORY));
    this.execTimeout = parseInt(
      await this.accountService.getParam(scenario.accountId, ACCOUNT_LIMIT_TESTER_EXEC_TIMEOUT),
    );

    const allScenarioSymbols = new Set();
    for (const set of scenario.sets) {
      const symbolArg = set.args.find(({ key }) => key === 'symbol');
      if (!symbolArg) continue;
      const symbol = formatTesterSymbol(symbolArg.value);

      allScenarioSymbols.add(symbolArg);
      this.eventEmitter.emit('client.prepare-tester-source-start', {
        accountId: scenario.accountId,
        symbol: symbol.replace(':USDT', ''),
      });

      try {
        await this.historyBarsService.prepareTesterSource({
          symbol: symbol.replace(':USDT', ''),
          timeframe: scenario.timeframe,
          start: new Date(scenario.start),
          end: new Date(scenario.end),
        });
      } catch (e) {
        this.eventEmitter.emit('client.prepare-tester-source-end', scenario.accountId);
        this.eventEmitter.emit('client.notification', {
          accountId: scenario.accountId,
          message:
            e instanceof AxiosError && e.response.status === 404
              ? `No ${symbol.replace(':USDT', '')} quotes found`
              : 'An error occurred while loading quotes',
          type: 'error',
        });
        e.cause = ExceptionReasonType.TesterDataFailed;
        throw e;
      }
    }

    this.eventEmitter.emit('client.prepare-tester-source-end', scenario.accountId);

    if (!scenario) {
      this.logger.error({ payload: scenarioId.toString() }, 'invalid scenario');
      return;
    }

    // this.currentScenarioId = scenarioId;
    this.currentScenario[scenarioId] = new Map(scenario.sets.map(({ id }) => [id, false]));

    const systemParams = ScriptScenarioStorageService.systemParamNames.map((key) => ({ key, value: scenario[key] }));
    const { strategy } = scenario;

    for (let index = 0; index < scenario.sets.length; index++) {
      const set = scenario.sets[index];
      const symbolArg = set.args.find(({ key }) => key === 'symbol');
      if (!symbolArg) return;
      const symbol = formatTesterSymbol(symbolArg.value);

      const { version } = await this.bundlerService.generateBundle(scenario.accountId, set.id.toString(), {
        ...strategy,
        mode: 'tester',
      });

      await this.runInChild({
        id: set.id,
        accountId: scenario.accountId,
        sync,
        strategy: { ...strategy, version: version.toString() },
        // symbol: symbolArg.value.toUpperCase().replace(':USDT', ''),
        symbol,
        start: scenario.start,
        end: scenario.end,
        set: [
          ...scenario.args,
          ...set.args,
          ...systemParams,
          {
            key: 'testerMultiSymbols',
            value: allScenarioSymbols.size,
          },
        ],
        artifacts: set.artifacts,
        index: index + 1,
      });
    }
  }

  private async runInChild({ id, accountId, sync, strategy, symbol, start, end, set, artifacts, index }: TaskType) {
    // 1. обновить ключ artifacts
    const json: string = JSON.stringify([...set, { key: 'symbol', value: symbol }]);
    const shiftedArtifacts = ScriptArtifactsService.createArtifactsKey([
      strategy.name,
      strategy.version,
      json,
      start,
      end,
    ]);
    if (artifacts !== shiftedArtifacts) {
      await this.scenarioStorageService.updateScenarioSet(id, { artifacts: shiftedArtifacts });
    }

    if (this.processes.size >= this.maxChild) {
      this.queue.push({ id, accountId, sync, strategy, symbol, start, end, set, artifacts: shiftedArtifacts, index });
      return;
    }

    // 2. проверить наличие логов и артифактов по данному ключу и завершить, не начиная
    const existed = await this.scenarioStorageService.checkExistedResults(id, shiftedArtifacts);
    if (existed && strategy.type !== 'local' && !this.disableArtifactsCache) {
      this.logger.info({ pid: process.pid, id: process.pid, artifacts: shiftedArtifacts }, `Process loaded from cache`);
      this.processes.set(process.pid, { child: undefined, accountId, startTime: Date.now() });
      await this.scenarioStorageService.updateScenarioSet(id, { isDone: true });

      return this.onChildStop(id, undefined, 1, shiftedArtifacts);
    }

    // prettier-ignore
    const runArgv = ['--id', id, '--symbol', symbol, '--start', start, '--end', end, '--optimizerIteration', index, ...set
      .filter(({ key, value }) => key !== 'symbol')
      .reduce((acc, { key, value }) => [...acc, `--${key}`, value], []),
    ];

    const child: ChildProcess = fork(process.env.CONSOLE_MODULE_PATH, runArgv, {
      env: {
        ...process.env,
        NODE_ENV: sync === true ? 'tester-sync' : 'tester',
        TESTER_OPTIMIZE_ARTIFACTS: shiftedArtifacts,
      },
    });
    this.processes.set(child.pid, { child, accountId, startTime: Date.now() });

    child.on('spawn', () => {
      this.logger.info({ pid: child.pid, id: process.pid, artifacts: shiftedArtifacts }, `Process started`);
      this.resultQueue.push({ id, status: 2 });
    });
    // child.on('exit', (error) => {
    //   this.logger.error(
    //     {
    //       error,
    //       pid: child.pid,
    //       id: process.pid,
    //       artifacts: shiftedArtifacts,
    //     },
    //     `Process child exit CODE ${error}`,
    //   );
    //   return this.onChildStop(id, child.pid, 3, shiftedArtifacts);
    // });
    child.on('error', (error: { code: string; message: string }) => {
      this.logger.error({ error, pid: child.pid, id: process.pid, artifacts: shiftedArtifacts }, 'Process child error');
      return this.onChildStop(id, child.pid, 3, shiftedArtifacts);
    });
    child.on('close', (k) => {
      this.logger.info(
        {
          pid: child.pid,
          id: process.pid,
          artifacts: shiftedArtifacts,
        },
        `Process stopped with code ${k}`,
      );
      return this.onChildStop(id, child.pid, 1, shiftedArtifacts);
    });
  }

  private async processQueue() {
    if (this.processes.size >= this.maxChild || this.queue.length < 1) return;

    const task = this.queue.shift();
    await this.runInChild(task);
  }

  private async onChildStop(id: number, pid: number, status: ScenarioStatusType, artifacts: string) {
    const currentScenario = await this.scenarioStorageService.getScenarioBySetId(id);
    if (!!pid) {
      this.processes.delete(pid);
    }
    if (!!currentScenario) {
      try {
        await this.scenarioService.updateScenarioReport(currentScenario.id);
      } catch (e) {
        this.logger.error(
          {
            scenarioId: currentScenario.id,
            stack: e.stack?.split('\n'),
            artifacts,
          },
          'Scenario report update failed',
        );
      }
    }

    this.resultQueue.push({ id, status });
    this.currentScenario[currentScenario?.id]?.set(id, true);

    const scenarioResult = Array.from(this.currentScenario[currentScenario?.id]?.values() ?? [])?.reduce(
      (acc, item) => acc && item,
      true,
    );
    if (scenarioResult) {
      this.currentScenario[currentScenario?.id] = undefined;
      this.logger.info({ pid, scenarioId: currentScenario?.id, artifacts }, 'Last scenario set processed');
    }

    await this.processQueue();
  }

  public stopAllProcesses(accountId: string = undefined) {
    this.processes.forEach((process) => {
      if (!accountId || accountId === process.accountId) return process.child?.send('force-stop');
    });
    this.queue = [];
  }

  public checkProcessLimits(pid: number, memoryUsage: number) {
    const { child, startTime } = this.processes.get(pid);
    if (memoryUsage > this.maxMemory) {
      child?.send('out-of-memory');
    }
    if (Date.now() - startTime > this.execTimeout * 1000) {
      child?.send('out-of-time');
    }
  }
}
