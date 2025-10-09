import {
  PreviewExecutionResponsePayload,
  Strategy,
  WS_CLIENT_EVENTS,
  WS_SERVER_EVENTS,
} from "@packages/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { emitSocketEvent, subscribe } from "@/shared/api/socket";
import { ThunkConfig } from "@/shared/types/store";
import { getPreview } from "../selectors";

interface PreviewExecutionRequestParams {
  exchange: string;
  strategy: Strategy;
  args: Record<string, unknown>;
  symbols: string[];
  key?: string;
}

export const previewExecutionRequest = createAsyncThunk<
  PreviewExecutionResponsePayload,
  PreviewExecutionRequestParams,
  ThunkConfig<null>
>("strategy/preview-execution-request", (payload, thunkAPI) => {
  return new Promise((res, rej) => {
    const { strategy, symbols, args, key, exchange } = payload;
    if (!symbols?.length || !args || !exchange || !key) return rej();

    const { getState } = thunkAPI;

    const existing = getPreview(key)(getState());
    if (existing) return rej();

    const unsub = subscribe(WS_SERVER_EVENTS.PREVIEW_EXECUTION_RESPONSE, (payload) => {
      clearTimeout(timeout);
      unsub();
      res(payload);
    });

    const timeout = setTimeout(() => {
      unsub();
      rej();
    }, 15000);

    emitSocketEvent({
      event: WS_CLIENT_EVENTS.PREVIEW_EXECUTION_REQUEST,
      payload: { key, strategy, args: { ...args, symbols, exchange } },
    });
  });
});
