import { Log, LogLevel } from "@packages/types";

export interface LogsSchema {
  levelFilter: string | null;
  processFilter: string | undefined;
  processes: Record<string, Log[]>;
  logView: LogView;
  __inited: boolean;
}

export const enum LogView {
  Console = "console",
  Table = "table",
}

export interface ConsoleLogFormat {
  method: LogLevel;
  data: Array<string | Record<string | number, unknown>>;
}

export interface TableLogFormat {
  level: string;
  date: string;
  message: string;
  context: Record<string | number, unknown>;
}

export interface LogProcess {
  id: string | number;
  name: string;
  strategy: string;
  artifacts: string;
}

export interface LogsPanelRef {
  setActive: (status: boolean) => void;
  toggle: VoidFunction;
}
