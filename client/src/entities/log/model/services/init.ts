import { WS_SERVER_EVENTS } from "@packages/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { subscribe } from "@/shared/api/socket";
import { ThunkConfig } from "@/shared/types/store";
import { isInited as isInitedSelector } from "../selectors";
import { logsActions } from "../slice/logs-slice";

export const initLogs = createAsyncThunk<void, void, ThunkConfig<void>>("log/init", (_, thunkAPI) => {
  const { dispatch, fulfillWithValue, getState } = thunkAPI;

  const isInited = isInitedSelector(getState());

  if (isInited) return;

  subscribe(WS_SERVER_EVENTS.LOGS_LIST_RESPONSE, (payload) => {
    dispatch(logsActions.setLogs(payload));
  });

  fulfillWithValue("");
});
