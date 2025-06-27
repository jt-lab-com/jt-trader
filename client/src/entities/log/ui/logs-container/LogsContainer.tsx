import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import { styled } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import { Message } from "@nicksrandall/console-feed/lib/definitions/Component";
import { LogLevel } from "@packages/types";
import { ChangeEvent, FC, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/shared/lib/hooks/useAppDispatch";
import { Iconify } from "@/shared/ui/iconify";
import { useLogs } from "../../lib/hooks/useLogs";
import { getLogView, getProcessFilter } from "../../model/selectors";
import { logsActions } from "../../model/slice/logs-slice";
import { LogProcess, LogView } from "../../model/types";
import { Console } from "../console/Console";
import { LogsTable } from "../logs-table/LogsTable";

interface LogsContainerProps {
  initialArtifactsId: string;
  processes?: LogProcess[];
  loading?: boolean;
}

export const LogsContainer: FC<LogsContainerProps> = (props) => {
  const { initialArtifactsId, processes, loading } = props;

  const dispatch = useAppDispatch();
  const element = useRef<HTMLDivElement | null>(null);
  const artifactsId = useSelector(getProcessFilter);
  const logView = useSelector(getLogView);
  const { filteredLogs, fetchLogs } = useLogs(artifactsId ?? initialArtifactsId);

  useEffect(() => {
    if (!artifactsId) {
      dispatch(logsActions.setProcessFilter(initialArtifactsId));
    }
  }, [initialArtifactsId]);

  useEffect(() => {
    if (element.current) {
      element.current.scrollTop = element.current.scrollHeight;
    }
  }, [filteredLogs]);

  const handleSetFilter = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch(logsActions.setLevelFilter(e.target.value as LogLevel));
  };

  const handleChangeProcess = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch(logsActions.setProcessFilter(e.target.value as string));
  };

  const handleChangeView = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch(logsActions.setLogViewType(e.target.value as LogView));
  };

  return (
    <>
      <Stack
        sx={{ py: 0.5, px: 2, bgcolor: (theme) => theme.palette.background.paper }}
        direction={"row"}
        alignItems={"center"}
        gap={1.5}
      >
        {processes && (
          <TextField
            sx={{ minWidth: 100 }}
            select
            value={artifactsId ?? ""}
            size={"small"}
            onChange={handleChangeProcess}
          >
            {processes.map((process) => (
              <MenuItem key={process.artifacts} value={process.artifacts}>
                {process.name}
              </MenuItem>
            ))}
          </TextField>
        )}

        <TextField sx={{ minWidth: 100 }} select value={logView} size={"small"} onChange={handleChangeView}>
          <MenuItem value={"table"}>Table</MenuItem>
          <MenuItem value={"console"}>Console</MenuItem>
        </TextField>

        {logView === LogView.Console && (
          <TextField sx={{ minWidth: 100 }} select size={"small"} onChange={handleSetFilter}>
            <MenuItem value={""}>All</MenuItem>
            <MenuItem value={"debug"}>Debug</MenuItem>
            <MenuItem value={"warn"}>Warnings</MenuItem>
            <MenuItem value={"info"}>Info</MenuItem>
            <MenuItem value={"error"}>Errors</MenuItem>
          </TextField>
        )}

        <IconButton sx={{ width: 30, height: 30 }} size={"small"} onClick={fetchLogs}>
          <Iconify width={20} color={"text.secondary"} icon={"solar:refresh-bold"} />
        </IconButton>
      </Stack>

      <Wrapper>
        {loading && <CircularProgress />}
        {!loading && logView === LogView.Table && <LogsTable data={filteredLogs} />}
        {!loading && logView === LogView.Console && <Console logList={filteredLogs as Message[]} />}
      </Wrapper>
    </>
  );
};

const Wrapper = styled(Box)(({ theme }) => ({
  height: "100%",
  overflowY: "auto",
  background: theme.palette.background.paper,
}));
