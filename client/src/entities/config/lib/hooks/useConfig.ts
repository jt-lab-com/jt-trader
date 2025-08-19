import { Exchange, TesterDefaultArgs } from "@packages/types";
import { useSelector } from "react-redux";
import {
  getEngineMode,
  getEngineVersion,
  getMainExchangeList,
  getAdditionalExchangeList,
  getS3Host,
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
  s3Host: string | null;
  testerDefaults: TesterDefaultArgs | null;
}

export const useConfig = (): UseConfigReturnParams => {
  const engineVersion = useSelector(getEngineVersion);
  const engineMode = useSelector(getEngineMode);
  const mainExchangeList = useSelector(getMainExchangeList);
  const additionalExchangeList = useSelector(getAdditionalExchangeList);

  const s3Host = useSelector(getS3Host);
  const testerDefaults = useSelector(getTesterDefaults);

  return {
    engineVersion,
    engineMode,
    exchanges: {
      main: mainExchangeList,
      additional: additionalExchangeList,
    },
    s3Host,
    testerDefaults,
  };
};
