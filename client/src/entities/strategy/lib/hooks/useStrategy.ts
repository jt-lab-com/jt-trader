import { Strategy, StrategyDefinedArg, StrategyType } from "@packages/types";
import { useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/shared/lib/hooks/useAppDispatch";
import { getLocalStrategies, getRemoteAppStrategies, getRemoteBundleStrategies } from "../../model/selectors";
import { fetchStrategies } from "../../model/services/fetch-strategies";
import { fetchStrategyContent } from "../../model/services/fetch-strategy-content";
import { initStrategies } from "../../model/services/init";

interface UseStrategyReturnParams {
  localStrategies: Strategy[];
  remoteBundleStrategies: Strategy[];
  remoteAppStrategies: Strategy[];
  fetchContent: (strategy: string) => void;
  fetchStrategies: () => void;
  getStrategy: (id: string, name: string, type: StrategyType) => Strategy | undefined;
  getStrategyDefinedArgs: (id: string, name: string, type: StrategyType) => StrategyDefinedArg[] | undefined;
}

export const useStrategy = (): UseStrategyReturnParams => {
  const dispatch = useAppDispatch();
  const localStrategies = useSelector(getLocalStrategies);
  const remoteBundleStrategies = useSelector(getRemoteBundleStrategies);
  const remoteAppStrategies = useSelector(getRemoteAppStrategies);

  useEffect(() => {
    dispatch(initStrategies());
  }, [dispatch]);

  const handleFetchContent = useCallback(
    (strategy: string) => {
      if (!strategy) return;
      dispatch(fetchStrategyContent(strategy));
    },
    [dispatch]
  );

  const handleFetchStrategies = useCallback(() => {
    dispatch(fetchStrategies());
  }, [dispatch]);

  const getStrategy = (id: string, name: string, type: StrategyType) => {
    if (type === "local") {
      return localStrategies.find((strategy) => strategy.name === name);
    }
    if (type === "bundle") {
      return remoteBundleStrategies.find(
        (strategy) => strategy.name === name && strategy.id.toString() === id
      );
    }

    return remoteAppStrategies.find((strategy) => strategy.name === name);
  };

  const getStrategyDefinedArgs = (id: string, name: string, type: StrategyType) => {
    const strategy = getStrategy(id, name, type);

    return strategy?.definedArgs;
  };

  return {
    localStrategies,
    remoteBundleStrategies,
    remoteAppStrategies,
    fetchContent: handleFetchContent,
    fetchStrategies: handleFetchStrategies,
    getStrategy,
    getStrategyDefinedArgs,
  };
};
