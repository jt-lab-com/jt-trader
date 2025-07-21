import { Log } from "@packages/types";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/shared/lib/hooks/useAppDispatch";
import { getFilteredProcessLogs, getProcessLogs } from "../../model/selectors";
import { fetchLogs } from "../../model/services/fetch";
import { initLogs } from "../../model/services/init";
import { subscribeLogsUpdate } from "../../model/services/subscribe";
import { logsActions } from "../../model/slice/logs-slice";
import { ConsoleLogFormat, TableLogFormat } from "../../model/types";

interface UseLogsReturnParams {
  logs: Log[];
  filteredLogs: Array<TableLogFormat | ConsoleLogFormat>;
  fetchLogs: () => void;
}

export const useLogs = (artifactsId: string, initialLogs?: Log[]): UseLogsReturnParams => {
  const dispatch = useAppDispatch();
  const logs = useSelector(getProcessLogs);
  const filteredLogs = useSelector(getFilteredProcessLogs);

  useEffect(() => {
    dispatch(initLogs());
  }, []);

  useEffect(() => {
    if (!artifactsId) return;
    dispatch(fetchLogs(artifactsId));
  }, [artifactsId]);

  useEffect(() => {
    if (!initialLogs) return;
    dispatch(logsActions.setLogs({ artifacts: artifactsId, data: initialLogs }));
  }, []);

  useEffect(() => {
    let unsub: () => void | undefined;
    if (artifactsId) {
      dispatch(subscribeLogsUpdate(artifactsId)).then((result) => {
        if (result.meta.requestStatus === "fulfilled") {
          unsub = result.payload as () => void;
        }
      });
    }

    return () => {
      if (unsub) {
        unsub();
      }
    };
  }, [artifactsId]);

  const handleFetchLogs = () => {
    dispatch(fetchLogs(artifactsId));
  };

  return {
    logs,
    filteredLogs,
    fetchLogs: handleFetchLogs,
  };
};
