import { Exchange, TesterDefaultArgs } from "@packages/types";
import { useSelector } from "react-redux";
import {
  getEngineMode,
  getEngineVersion,
  getExchangesList,
  getS3Host,
  getTesterDefaults,
} from "../../model/selectors";
import { EngineMode } from "../../model/types";

interface UseConfigReturnParams {
  engineVersion: string | null;
  engineMode: EngineMode | null;
  exchangeList: Exchange[];
  s3Host: string | null;
  testerDefaults: TesterDefaultArgs | null;
}

export const useConfig = (): UseConfigReturnParams => {
  const engineVersion = useSelector(getEngineVersion);
  const engineMode = useSelector(getEngineMode);
  const exchangeList = useSelector(getExchangesList);
  const s3Host = useSelector(getS3Host);
  const testerDefaults = useSelector(getTesterDefaults);

  return {
    engineVersion,
    engineMode,
    exchangeList,
    s3Host,
    testerDefaults,
  };
};
