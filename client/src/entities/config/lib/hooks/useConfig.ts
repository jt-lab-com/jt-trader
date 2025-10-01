import { Exchange, TesterDefaultArgs } from "@packages/types";
import { useSelector } from "react-redux";
import {
  getEngineMode,
  getEngineVersion,
  getMainExchangeList,
  getAdditionalExchangeList,
  getTesterDefaults,
} from "../../model/selectors";
import { EngineMode } from "../../model/types";

interface UseConfigReturnParams {
  engineVersion: string | null;
  engineMode: EngineMode | null;
  exchanges: {
    main: Exchange[];
    additional?: Exchange[];
  };
  testerDefaults: TesterDefaultArgs | null;
}

export const useConfig = (): UseConfigReturnParams => {
  const engineVersion = useSelector(getEngineVersion);
  const engineMode = useSelector(getEngineMode);
  const mainExchangeList = useSelector(getMainExchangeList);
  const additionalExchangeList = useSelector(getAdditionalExchangeList);

  const testerDefaults = useSelector(getTesterDefaults);

  return {
    engineVersion,
    engineMode,
    exchanges: {
      main: mainExchangeList,
      additional: additionalExchangeList,
    },
    testerDefaults,
  };
};
