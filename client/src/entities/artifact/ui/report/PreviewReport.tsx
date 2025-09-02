import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import { Strategy } from "@packages/types";
import { FC, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/shared/lib/hooks/useAppDispatch";
import { useDebounce } from "@/shared/lib/hooks/useDebounce";
import { getPreview, isArtifactLoading } from "../../model/selectors";
import { previewExecutionRequest } from "../../model/services/preview-execution-request";
import { Report } from "./Report";

interface PreviewReportProps {
  strategy: Strategy;
  exchange: string;
  symbols: string[];
  args: Record<string, unknown>;
}

export const PreviewReport: FC<PreviewReportProps> = (props) => {
  const { strategy, exchange, symbols, args } = props;

  const dispatch = useAppDispatch();

  const payload = useMemo(() => {
    return { strategy, exchange, symbols, args };
  }, [strategy, exchange, symbols, args]);
  const key = useMemo(() => {
    const { strategy, symbols, args, exchange } = payload;
    if (!strategy) return undefined;
    const strategyInfo = `${strategy.name}-${strategy.id}`;

    return `${strategyInfo}::${symbols.join("-")}::${exchange}::${objectToSortedString(args)}`;
  }, [payload]);

  const request = useDebounce(() => {
    dispatch(previewExecutionRequest({ ...payload, args: { exchange, ...payload.args }, key }));
  }, 800);

  useEffect(() => {
    request();
  }, [payload]);

  const isLoading = useSelector(isArtifactLoading);
  const artifact = useSelector(getPreview(key));

  if (isLoading)
    return (
      <Stack alignItems={"center"} justifyContent={"center"}>
        <CircularProgress />
      </Stack>
    );

  if (!artifact) return null;

  return <Report artifact={artifact} isPreview />;
};

function objectToSortedString(obj: Record<string, any>): string {
  const sortedKeys = Object.keys(obj).sort();
  const sortedEntries = sortedKeys.map((key) => `${key}=${obj[key]}`);
  return sortedEntries.join("&");
}
