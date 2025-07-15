import { ScenarioScope, StaticScopeParam } from "@packages/types";
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

  let scope: ScenarioScope[] = [
    [defaultDynamicParam.name, defaultDynamicParam.begin, defaultDynamicParam.end, defaultDynamicParam.step],
  ];
  let args: StaticScopeParam[] = staticScope;

  if (withOptimizer) {
    const dynamicKeys: string[] = [];
    scope = dynamicScope.map(({ name, begin, end, step }: DynamicScopeParam) => {
      dynamicKeys.push(name);
      if (begin > end) end = begin;
      return [name, begin, end, step];
    });
    args = staticScope.filter((param: StaticScopeParam) => !dynamicKeys.includes(param.key));
  }

  return {
    symbols: symbols.split(",").map((symbol: string) => symbol.trim()) ?? [],
    start: startTime,
    end: endTime,
    args,
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
