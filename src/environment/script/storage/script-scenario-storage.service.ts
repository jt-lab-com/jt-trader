import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Scenario, ScenarioSet } from '@prisma/client';
import { ScriptArtifactsService } from '../artifacts/script-artifacts.service';
import { SystemParamsInterface } from '../scenario/script-scenario.service';
import { StrategyItem } from '../types';
import { PrismaService } from '../../../common/prisma/prisma.service';

export type ScenarioStatusType = 0 | 1 | 2 | 3;

export interface ScenarioSetArg {
  key: string;
  value: string;
}

export interface ScenarioInterface extends SystemParamsInterface {
  id?: number;
  name: string;
  accountId: string;
  strategy: StrategyItem;
  symbols: string[];
  args: { key: string; value: number | string | boolean }[];
  dynamicArgs: [string, number, number, number][];
  sets: (ScenarioSet & { args: ScenarioSetArg[] })[];
  start: string; // yyyy-mm format
  end: string; // yyyy-mm format
  artifacts?: string;
  status?: ScenarioStatusType;
}

@Injectable()
export class ScriptScenarioStorageService {
  static systemParamNames = [
    'marketOrderSpread',
    'defaultLeverage',
    'makerFee',
    'takerFee',
    'timeframe',
    'hedgeMode',
    'balance',
    'exchange',
    'withOptimizer',
  ];

  constructor(
    private readonly prisma: PrismaService,
    @InjectPinoLogger(ScriptScenarioStorageService.name) private readonly logger: PinoLogger,
  ) {}

  public async updateScenarioSet(id: number, data: { [Property in keyof ScenarioSet]? }): Promise<void> {
    await this.prisma.scenarioSet.update({ where: { id }, data });
  }

  public async updateStatus(id: number, status: ScenarioStatusType) {
    await this.updateScenarioSet(id, { status });
  }

  public async markScenarioSetAsDone(id: number) {
    await this.updateScenarioSet(id, { isDone: true });
  }

  public async markScenarioAsDone(id: number) {
    await this.prisma.scenario.update({ where: { id }, data: { isDone: true } });
  }

  public async saveScenario(scenario: ScenarioInterface) {
    const { createArtifactsKey } = ScriptArtifactsService;
    const { accountId, name, start, end, args, dynamicArgs, symbols, strategy } = scenario;
    let sets: any[];

    const buildSetItem = (symbol: string, args: ScenarioSetArg[] = []) => {
      const json: string = JSON.stringify([...args, { key: 'symbol', value: symbol }]);
      return {
        status: 0,
        args: json,
        // artifacts: createArtifactsKey([strategy.name, strategy.version, json, start, end]),
      };
    };

    if (scenario.sets && scenario.sets.length > 0) {
      sets = symbols.reduce((acc, symbol) => {
        // @ts-ignore
        const items = scenario.sets.map((item) => buildSetItem(symbol, item));
        return [...acc, ...items];
      }, []);
    } else {
      sets = symbols.map((symbol) => buildSetItem(symbol));
    }

    const jsonArgs = JSON.stringify(args);
    const jsonDynamicArgs = JSON.stringify(dynamicArgs);
    const artifacts = createArtifactsKey([strategy.name, strategy.version, jsonArgs, start, end]);
    try {
      return this.prisma.scenario.create({
        data: {
          accountId,
          name,
          strategy: strategy.name,
          strategyId: strategy.id,
          strategyType: strategy.type,
          strategyPath: strategy.type === 'local' ? strategy.path : null,
          start,
          end,
          args: jsonArgs,
          dynamicArgs: jsonDynamicArgs,
          artifacts,
          sets: { create: sets },
        },
      });
    } catch (e) {
      this.logger.error({ stack: e.stack?.split('\n'), message: e.message }, 'Scenario create error');
    }
  }

  public async getScenarioList(accountId: string): Promise<ScenarioInterface[]> {
    return (
      await this.prisma.scenario.findMany({
        where: { accountId },
        include: { sets: true },
      })
    ).map(this.formatScenario);
  }

  public async getScenario(id: number): Promise<ScenarioInterface> {
    if (!id) throw new Error('scenarioId is required');

    const result = await this.prisma.scenario.findUnique({ where: { id }, include: { sets: true } });
    return this.formatScenario(result);
  }

  public async getScenarioBySetId(id: number): Promise<ScenarioInterface> {
    if (!id) throw new Error('scenarioSetId is required');

    const set = await this.prisma.scenarioSet.findUnique({ where: { id } });
    if (!set) return undefined;
    return this.getScenario(set.scenarioId);
  }

  public async removeScenario(id: number): Promise<void> {
    await this.prisma.scenario.delete({ where: { id } });
  }

  public async checkExistedResults(id: number, artifacts: string): Promise<boolean> {
    const existed = await this.prisma.scenarioSet.findFirst({ where: { id: { not: id }, isDone: true, artifacts } });
    return !!existed;
  }

  private formatScenario(scenario: Scenario & { sets: ScenarioSet[] }): ScenarioInterface {
    const allArgs = JSON.parse(scenario.args);
    const args = allArgs?.filter(({ key }) => ScriptScenarioStorageService.systemParamNames.indexOf(key) === -1);
    const systemParams = allArgs
      ?.filter(({ key }) => ScriptScenarioStorageService.systemParamNames.indexOf(key) > -1)
      ?.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {});

    const sets: (ScenarioSet & { args: ScenarioSetArg[] })[] = scenario.sets.map((setItem) => ({
      ...setItem,
      args: JSON.parse(setItem.args),
    }));

    const symbols: Set<string> = new Set<string>(
      sets
        .map((set) => {
          const symbolArg = set.args.find(({ key }) => key === 'symbol');
          return symbolArg?.value;
        })
        .filter((value) => !!value),
    );

    return {
      ...scenario,
      symbols: Array.from(symbols),
      args,
      ...systemParams,
      sets,
      dynamicArgs: JSON.parse(scenario.dynamicArgs),
      strategy: {
        id: scenario.strategyId,
        name: scenario.strategy,
        type: scenario.strategyType,
        path: scenario.strategyPath,
      },
    };
  }
}
