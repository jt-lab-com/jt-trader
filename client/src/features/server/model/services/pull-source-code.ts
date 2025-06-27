import { WS_CLIENT_EVENTS, WS_SERVER_EVENTS } from "@packages/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { emitSocketEvent, subscribe } from "@/shared/api/socket";
import { ThunkConfig } from "@/shared/types/store";

interface PullUserSourceResult {
  error: boolean;
  message: string;
}

export const pullUserSourceCode = createAsyncThunk<
  PullUserSourceResult,
  void,
  ThunkConfig<PullUserSourceResult>
>("server/pull-user-source-code-request", async () => {
  const pullSourceCodeRequest = () => {
    return new Promise<PullUserSourceResult>((res) => {
      const unsub = subscribe(WS_SERVER_EVENTS.PULL_USER_SOURCE_CODE_RESPONSE, (data) => {
        unsub();
        if (data.error) {
          return res(data);
        }
      });

      emitSocketEvent({ event: WS_CLIENT_EVENTS.PULL_USER_SOURCE_CODE_REQUEST });

      setTimeout(() => {
        res({ error: true, message: "Server is not responding" });
      }, 10000);
    });
  };

  return pullSourceCodeRequest();
});
