import { Scenario, StrategyArg, TesterDefaultArgs } from "@packages/types";
import { DynamicScopeParam } from "../types";
import { ScenarioSchema } from "./scenario.schema";

export const defaultStaticParam: StrategyArg = { key: "", value: "" };
export const defaultDynamicParam: DynamicScopeParam = { name: "param", begin: 0, end: 0, step: 1 };

export const getDefaultValues = (scenario?: Scenario, testerDefaults?: TesterDefaultArgs | null) => {
  const getDynamicScope = () => {
    if (scenario?.dynamicArgs) {
      return scenario.dynamicArgs.map(([name, begin, end, step]) => ({
        name,
        begin,
        end,
        step,
      }));
    }

    return [{ ...defaultDynamicParam }];
  };

  const defaultValues: ScenarioSchema = {
    scenarioName: scenario?.name ?? "",
    selectedStrategy: scenario?.strategy ?? null,
    hedgeMode: scenario?.hedgeMode ?? testerDefaults?.hedgeMode ?? true,
    withOptimizer: scenario?.withOptimizer ?? true,
    symbols: scenario?.symbols.join(", ") ?? testerDefaults?.symbols.join(", ") ?? "",
    startTime: scenario?.start ?? testerDefaults?.start ?? "",
    endTime: scenario?.end ?? testerDefaults?.end ?? "",
    spread: scenario?.marketOrderSpread ?? testerDefaults?.marketOrderSpread ?? 0,
    makerFee: scenario?.makerFee ?? testerDefaults?.makerFee ?? 0.002,
    takerFee: scenario?.takerFee ?? testerDefaults?.takerFee ?? 0.00045,
    leverage: scenario?.defaultLeverage ?? testerDefaults?.defaultLeverage ?? 50,
    timeframe: scenario?.timeframe.toString() ?? testerDefaults?.timeframe.toString() ?? "1",
    balance: scenario?.balance ?? testerDefaults?.balance ?? 1000,
    exchange: scenario?.exchange ?? testerDefaults?.exchange ?? "",
    staticScope: scenario?.args ?? [{ ...defaultStaticParam }],
    dynamicScope: getDynamicScope(),
  };

  return defaultValues;
};
