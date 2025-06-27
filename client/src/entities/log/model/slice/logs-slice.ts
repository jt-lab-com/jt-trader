import { Log, LogLevel, UserLogsUpdatePayload } from "@packages/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { initLogs } from "../services/init";
import { LogsSchema, LogView } from "../types";

const initialState: LogsSchema = {
  levelFilter: null,
  processFilter: undefined,
  processes: {},
  logView: LogView.Table,
  __inited: false,
};

const logsSlice = createSlice({
  name: "logs",
  initialState,
  reducers: {
    setLogs: (state, action: PayloadAction<{ artifacts: string; data: Log[] }>) => {
      const { artifacts, data } = action.payload;
      state.processes[artifacts] = data;
    },
    setLogViewType: (state, action: PayloadAction<LogView>) => {
      state.logView = action.payload;

      if (action.payload === LogView.Table) {
        state.levelFilter = null;
      }
    },
    setLevelFilter: (state, action: PayloadAction<LogLevel>) => {
      state.levelFilter = action.payload;
    },
    setProcessFilter: (state, action: PayloadAction<string>) => {
      state.processFilter = action.payload;
    },
    updateLogs: (state, action: PayloadAction<UserLogsUpdatePayload>) => {
      const { log, artifacts } = action.payload;

      if (!state.processes[artifacts]) {
        state.processes[artifacts] = [];
      }

      state.processes[artifacts] = [...state.processes[artifacts], log];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(initLogs.fulfilled, (state) => {
      state.__inited = true;
    });
  },
});

export const { reducer: logsReducer } = logsSlice;
export const { actions: logsActions } = logsSlice;
