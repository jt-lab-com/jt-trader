import { WS_SERVER_EVENTS } from "@packages/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { subscribe } from "@/shared/api/socket";
import { ThunkConfig } from "@/shared/types/store";
import { logsActions } from "../slice/logs-slice";

let subscribesArtifactsIds: string[] = [];

export const subscribeLogsUpdate = createAsyncThunk<(() => void) | undefined, string, ThunkConfig<void>>(
  "logs/subscribe",
  (artifactsId, thunkAPI) => {
    const { dispatch } = thunkAPI;
    if (subscribesArtifactsIds.includes(artifactsId)) return;

    subscribesArtifactsIds.push(artifactsId);

    const unsub = subscribe(WS_SERVER_EVENTS.USER_SCRIPT_LOG, (data) => {
      if (artifactsId === data.artifacts) {
        dispatch(logsActions.updateLogs(data));
      }
    });

    return () => {
      unsub();
      subscribesArtifactsIds = subscribesArtifactsIds.filter((id) => id !== artifactsId);
    };
  }
);
