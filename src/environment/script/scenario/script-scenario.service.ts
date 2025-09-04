import { Injectable } from '@nestjs/common';
import { ScriptScenarioStorageService } from '../storage/script-scenario-storage.service';
import { ScriptArtifactsService } from '../artifacts/script-artifacts.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AccountService } from '../../account/account.service';
import { ACCOUNT_LIMIT_OPTIMIZER_SCENARIO } from '../../account/const';
import { StrategyItem } from '../types';

export interface SystemParamsInterface {
  marketOrderSpread?: number;
  pricePrecision?: number;
  defaultLeverage?: number;
  makerFee?: number;
  takerFee?: number;
  timeframe?: number;
  hedgeMode?: boolean;
  contractSize?: number;
}

export interface ScenarioDTO extends SystemParamsInterface {
  accountId: string;
  name: string;
  strategy: StrategyItem;
  start: string;
  end: string;
  args: { key: string; value: string | number }[];
  scope: [string, number, number, number][];
  symbols: string[];
}

const OPTIMIZER_RESULTS = 'optimizer_results';
const OPTIMIZER_CHARTS = 'optimizer_coins_basket';

@Injectable()
export class ScriptScenarioService {
  constructor(
    private readonly storage: ScriptScenarioStorageService,
    private readonly artifactsService: ScriptArtifactsService,
    private readonly accountService: AccountService,
    @InjectPinoLogger(ScriptScenarioService.name) private readonly logger: PinoLogger,
  ) {}

  async compileAndSave(data: ScenarioDTO) {
    const { accountId, name, strategy, start, end, args, scope, symbols, ...systemParams } = data;
    let _args = [];
    const withFloatArg = (key, start, end, step) => {
      const result = [];
      let value = start;
      while (value <= end) {
        result.push([{ key, value }]);
        value += step;
      }

      _args =
        _args.length > 0
          ? _args.reduce((acc, args) => [...acc, ...result.map((argsNew) => [...args, ...argsNew])], [])
          : result;
    };

    scope.forEach(([key, start, end, step]) => {
      withFloatArg(key, start, end, step);
    });

    const maxScenarioSets = parseInt(await this.accountService.getParam(accountId, ACCOUNT_LIMIT_OPTIMIZER_SCENARIO));

    return this.storage.saveScenario({
      name,
      accountId,
      strategy,
      symbols,
      start,
      end,
      args: [...args, ...Object.entries(systemParams).map(([key, value]) => ({ key, value }))],
      dynamicArgs: scope,
      sets: _args.slice(0, maxScenarioSets),
    });
  }

  async findAll(accountId: string) {
    return (await this.storage.getScenarioList(accountId)).sort((a, b) => {
      const [nameA, nameB] = [a.name.toUpperCase(), b.name.toUpperCase()];
      return nameA <= nameB ? 1 : -1;
    });
  }

  removeScenario(scenarioId: number): Promise<void> {
    return this.storage.removeScenario(scenarioId);
  }

  async updateScenarioReport(scenarioId: number): Promise<void> {
    const scenario = await this.storage.getScenario(scenarioId);
    if (!scenario) {
      this.logger.error({ id: scenarioId }, 'Invalid scenario');
      return;
    }

    let isDone = true;
    const data: any[] = scenario.sets.reduce(
      (acc, set) => {
        isDone = isDone && set.isDone;
        const report: { blocks: any[] } = this.artifactsService.read(set.artifacts);
        if (!report || !Array.isArray(report.blocks)) return acc;

        const [result, charts] = acc;
        report.blocks
          .filter((item) => [OPTIMIZER_RESULTS, OPTIMIZER_CHARTS].indexOf(item.type) > -1)
          .map((item) => {
            switch (item.type) {
              case OPTIMIZER_RESULTS: {
                result.push({
                  ...item.data,
                  report_link: `/report/${set.artifacts}`,
                });
                break;
              }
              case OPTIMIZER_CHARTS: {
                charts.push({ ...item });
                break;
              }
            }
          });

        return [[...result], [...charts]];
      },
      [[], []],
    );

    const [result, charts] = data;
    const reportBlocks = [];

    if (isDone) {
      await this.storage.markScenarioAsDone(scenarioId);
    }

    if (charts.length > 0) {
      let [volumeSum, ordersCountSum, drawdownMax, drawdownMaxPointProfit, profitResult] = [0, 0, 0, 0, 0];
      const { workingBalance, profitChart } = charts[0];
      const profitDataArray = Object.entries<{ profit: number; drawdown: number }>(profitChart);

      for (let i = 0; i < charts.length; i++) {
        volumeSum += charts[i].volumeUsd;
        ordersCountSum += charts[i].ordersCount;
      }

      const series = [];
      const seriesDown = [];
      const seriesTime = [];
      const lastExistedProfit = [];
      const lastExistedDrawdown = [];

      for (let i = 0; i < profitDataArray.length; i++) {
        const [tms, { profit, drawdown }] = profitDataArray[i];
        let drawdownSum = drawdown;
        let profitSum = profit;

        for (let j = 1; j < charts.length; j++) {
          const drawdownItem = charts[j].profitChart[tms]?.drawdown ?? lastExistedDrawdown[j];
          const profitItem = charts[j].profitChart[tms]?.profit ?? lastExistedProfit[j];

          drawdownSum += drawdownItem;
          profitSum += profitItem;

          lastExistedDrawdown[j] = drawdownItem;
          lastExistedProfit[j] = profitItem;
        }

        series.push(profitSum.toFixed(2));
        seriesDown.push(drawdownSum.toFixed(2));
        seriesTime.push(parseInt(tms));

        // drawdownMax = drawdownSum < drawdownMax ? drawdownSum : drawdownMax;
        if (drawdownSum < drawdownMax) {
          drawdownMax = drawdownSum;
          drawdownMaxPointProfit = profitSum;
        }

        if (i === profitDataArray.length - 1) profitResult = profitSum;
      }
      reportBlocks.push({
        type: 'text',
        isVisible: true,
        data: {
          value: scenario.name,
          variant: 'h3',
          align: 'center',
        },
      });
      reportBlocks.push({
        type: 'card',
        isVisible: true,
        data: { title: 'Profit', value: profitResult, variant: 'number', options: { format: 'currency' } },
      });
      reportBlocks.push({
        type: 'card',
        isVisible: true,
        data: {
          title: 'Profit %',
          value: ((profitResult / workingBalance) * 100).toFixed(1),
          variant: 'percent',
          options: {},
        },
      });
      reportBlocks.push({
        type: 'card',
        isVisible: true,
        data: { title: 'Max Drawdown', value: drawdownMax, variant: 'number', options: { format: 'currency' } },
      });
      reportBlocks.push({
        type: 'card',
        isVisible: true,
        data: {
          title: 'Max Drawdown, %',
          value: (Math.abs(drawdownMax / (workingBalance + drawdownMaxPointProfit)) * 100).toFixed(1),
          variant: 'percent',
          options: { isVisible: true },
        },
      });
      reportBlocks.push({
        type: 'card',
        isVisible: true,
        data: { title: 'Volume', value: volumeSum, variant: 'number', options: { format: 'currency' } },
      });
      reportBlocks.push({
        type: 'card',
        isVisible: false,
        data: { title: 'Orders', value: ordersCountSum, variant: 'number', options: {} },
      });
      reportBlocks.push({
        type: 'chart',
        name: 'Profit',
        isVisible: true,
        data: {
          series: [
            { name: '', data: [] },
            { name: 'Profit', data: series },
            { name: 'Drawdown', data: seriesDown },
          ],
          time: seriesTime,
        },
      });
    }

    reportBlocks.push({ type: 'table', name: 'Optimization', isVisible: true, data: result });
    this.artifactsService.save(scenario.artifacts, { blocks: reportBlocks });
  }
}
