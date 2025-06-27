import { WS_SERVER_EVENTS } from "@packages/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { subscribe } from "@/shared/api/socket";
import { ThunkConfig } from "@/shared/types/store";
import { fetchArtifact } from "./fetch-artifact";

type UnsubscribeArtifact = VoidFunction;

export const subscribeArtifactUpdate = createAsyncThunk<UnsubscribeArtifact, string, ThunkConfig<void>>(
  "artifact/subscribe",
  (artifactId, thunkAPI) => {
    const { dispatch } = thunkAPI;
    return subscribe(WS_SERVER_EVENTS.UPDATE_REPORT, (payload) => {
      if (artifactId !== payload.artifacts) return;
      dispatch(fetchArtifact(artifactId));
    });
  }
);
