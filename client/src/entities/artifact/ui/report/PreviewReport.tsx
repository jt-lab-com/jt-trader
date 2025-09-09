import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import { Strategy } from "@packages/types";
import { FC, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/shared/lib/hooks/useAppDispatch";
import { useDebounce } from "@/shared/lib/hooks/useDebounce";
import { getPreview, isArtifactLoading } from "../../model/selectors";
import { previewExecutionRequest } from "../../model/services/preview-execution-request";
import { Artifact } from "../../model/types";
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

  const isLoading = useSelector(isArtifactLoading);
  const artifact = useSelector(getPreview(key));
  const [artifactView, setArtifactView] = useState<Artifact | null>(null);

  const request = useDebounce(() => {
    dispatch(previewExecutionRequest({ ...payload, args: { exchange, ...payload.args }, key }));
  }, 800);

  useEffect(() => {
    request();
  }, [payload]);

  useEffect(() => {
    if (!artifact) return;
    setArtifactView(artifact);
  }, [artifact]);

  if (isLoading && !artifactView)
    return (
      <Stack alignItems={"center"} justifyContent={"center"}>
        <CircularProgress />
      </Stack>
    );

  return (
    <Box sx={{ position: "relative" }}>
      {artifactView && <Report artifact={artifactView} isPreview />}
      {isLoading && (
        <Stack
          sx={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: "100%",
            background: "rgba(255, 255, 255, 0.5)",
          }}
          alignItems={"center"}
          justifyContent={"center"}
        >
          <CircularProgress />
        </Stack>
      )}
    </Box>
  );
};

function objectToSortedString(obj: Record<string, any>): string {
  const sortedKeys = Object.keys(obj).sort();
  const sortedEntries = sortedKeys.map((key) => `${key}=${obj[key]}`);
  return sortedEntries.join("&");
}
