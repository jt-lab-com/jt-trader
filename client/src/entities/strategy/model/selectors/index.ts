import { StateSchema } from "@/shared/types/store";

export const isStrategyInited = (state: StateSchema) => state.strategy.__inited;
export const getLocalStrategies = (state: StateSchema) => state.strategy.localStrategies;
export const getRemoteBundleStrategies = (state: StateSchema) => state.strategy.remoteBundleStrategies;
export const getRemoteAppStrategies = (state: StateSchema) => state.strategy.remoteAppStrategies;
export const getStrategyContent = (strategyPath: string) => (state: StateSchema) =>
  state.strategy.strategyContent[strategyPath] ?? "";
