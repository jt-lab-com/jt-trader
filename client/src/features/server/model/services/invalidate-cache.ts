import { WS_CLIENT_EVENTS, WS_SERVER_EVENTS } from "@packages/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { emitSocketEvent, subscribe } from "@/shared/api/socket";
import { ThunkConfig } from "@/shared/types/store";

export const invalidateCache = createAsyncThunk<void, void, ThunkConfig<void>>(
  "server/invalidate-cache",
  () => {
    return new Promise((resolve, reject) => {
      subscribe(WS_SERVER_EVENTS.INVALIDATE_CACHE_RESPONSE, () => {
        resolve();
      });

      emitSocketEvent({ event: WS_CLIENT_EVENTS.INVALIDATE_CACHE_REQUEST });

      setTimeout(() => {
        reject();
      }, 15000);
    });
  }
);
