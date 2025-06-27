import { Log } from "@packages/types";
import dayjs from "dayjs";
import { createSelector } from "reselect";
import { StateSchema } from "@/shared/types/store";
import { ConsoleLogFormat, LogView, TableLogFormat } from "../types";

export const isInited = (state: StateSchema) => state.logs.__inited;

export const getLogLevelFilter = (state: StateSchema) => state.logs.levelFilter;
export const getProcessFilter = (state: StateSchema) => state.logs.processFilter;
export const getLogView = (state: StateSchema) => state.logs.logView;
export const getLogs = (state: StateSchema) => state.logs.processes;
export const getProcessLogs = createSelector(getProcessFilter, getLogs, (process, logs) => {
  if (!process) return [];
  return logs[process];
});

export const getFilteredProcessLogs = createSelector(
  getLogLevelFilter,
  getProcessLogs,
  getLogView,
  (filter, logs, view) => {
    if (!logs) return [];

    const filtered = logs
      .filter(({ level }) => (filter ? level === filter : true))
      .sort((a, b) => b.time - a.time);

    if (view === LogView.Console) {
      return filtered.map(formatConsole);
    }

    return filtered.map(formatTable);
  }
);

const formatConsole = (log: Log): ConsoleLogFormat => {
  const date = new Date(log.time);
  let message = log.msg;

  try {
    message = JSON.parse(log.msg);
  } catch (e) {
    /* empty */
  }

  return {
    method: log.level,
    data: [`[ ${log.level} | ${date.toLocaleDateString()} ${date.toLocaleTimeString()} ]`, message],
  };
};

const formatTable = (log: Log): TableLogFormat => {
  const { level, msg, time, ...rest } = log;
  const isArray = Array.isArray(msg);
  const message = !isArray ? msg : msg[0];
  const context = !isArray ? rest : msg[1];

  return {
    level,
    date: dayjs(time).format("YYYY-MM-DD HH:mm:ss"),
    message,
    context,
  };
};
