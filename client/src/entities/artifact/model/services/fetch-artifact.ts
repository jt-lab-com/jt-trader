import { WS_CLIENT_EVENTS, WS_SERVER_EVENTS } from "@packages/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { emitSocketEvent, subscribe } from "@/shared/api/socket";
import { ThunkConfig } from "@/shared/types/store";
import { Artifact } from "../types";

export const fetchArtifact = createAsyncThunk<Artifact, string, ThunkConfig<void>>(
  "artifact/fetch",
  async (artifactsId, thunkAPI) => {
    const { rejectWithValue } = thunkAPI;
    if (!artifactsId) return rejectWithValue();

    const getArtifact = (): Promise<Artifact> => {
      return new Promise((res, rej) => {
        const unsub = subscribe(WS_SERVER_EVENTS.ARTIFACTS_RESPONSE, (payload) => {
          if (payload.artifacts !== artifactsId) return;
          unsub();
          res(payload.data);
        });

        emitSocketEvent({ event: WS_CLIENT_EVENTS.ARTIFACTS_REQUEST, payload: artifactsId });

        setTimeout(() => {
          unsub();
          rej();
        }, 10000);
      });
    };

    try {
      return await getArtifact();
    } catch (e) {
      return rejectWithValue();
    }
  }
);
