import { Strategy } from "@packages/types";

export interface StrategySchema {
  localStrategies: Strategy[];
  remoteBundleStrategies: Strategy[];
  remoteAppStrategies: Strategy[];
  strategyContent: Record<string, string>;
  __inited: boolean;
}
