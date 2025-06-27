import { StaticScopeParam } from "@packages/types";
import { defaultDynamicParam } from "../schema/default-values";
import { ScenarioSchema } from "../schema/scenario.schema";
import { DynamicScopeParam } from "../types";

export const prepareApiPayload = (data: ScenarioSchema) => {
  const {
    symbols,
    selectedStrategy,
    endTime,
    startTime,
    hedgeMode,
    withOptimizer,
    leverage,
    makerFee,
    takerFee,
    spread,
    timeframe,
    dynamicScope,
    staticScope,
    scenarioName,
    balance,
    exchange,
  } = data;

  const scope = !withOptimizer
    ? [
        [
          defaultDynamicParam.name,
          defaultDynamicParam.begin,
          defaultDynamicParam.end,
          defaultDynamicParam.step,
        ],
      ]
    : dynamicScope.map(({ name, begin, end, step }: DynamicScopeParam) => {
        if (begin > end) {
          end = begin;
        }
        return [name, begin, end, step];
      });

  return {
    symbols: symbols.split(",").map((symbol: string) => symbol.trim()) ?? [],
    start: startTime,
    end: endTime,
    args: staticScope?.map((param: StaticScopeParam) => ({ ...param, value: param.value })) ?? [],
    strategy: { ...selectedStrategy, id: selectedStrategy.id.toString() },
    marketOrderSpread: spread,
    makerFee,
    takerFee,
    defaultLeverage: leverage,
    timeframe: parseInt(timeframe),
    name: scenarioName,
    balance,
    exchange,
    hedgeMode: hedgeMode ?? false,
    withOptimizer: withOptimizer ?? true,
    scope,
  };
};
