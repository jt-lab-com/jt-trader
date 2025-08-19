import { Exchange, TesterDefaultArgs } from "@packages/types";
import { useSelector } from "react-redux";
import { getEngineMode, getEngineVersion, getExchangesList, getTesterDefaults } from "../../model/selectors";
import { EngineMode } from "../../model/types";

interface UseConfigReturnParams {
  engineVersion: string | null;
  engineMode: EngineMode | null;
  exchangeList: Exchange[];
  testerDefaults: TesterDefaultArgs | null;
}

export const useConfig = (): UseConfigReturnParams => {
  const engineVersion = useSelector(getEngineVersion);
  const engineMode = useSelector(getEngineMode);
  const exchangeList = useSelector(getExchangesList);
  const testerDefaults = useSelector(getTesterDefaults);

  return {
    engineVersion,
    engineMode,
    exchangeList,
    testerDefaults,
  };
};
