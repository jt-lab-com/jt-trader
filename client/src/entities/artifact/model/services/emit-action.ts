import {
  ReportActionButtonRequestPayload,
  ReportActionButtonResponsePayload,
  WS_CLIENT_EVENTS,
  WS_SERVER_EVENTS,
} from "@packages/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";
import { emitSocketEvent, subscribe } from "@/shared/api/socket";
import { ThunkConfig } from "@/shared/types/store";

export const emitAction = createAsyncThunk<
  ReportActionButtonResponsePayload,
  Omit<ReportActionButtonRequestPayload, "requestId">,
  ThunkConfig<void>
>("artifact/emit-action", (data) => {
  return new Promise((res, rej) => {
    const requestId = nanoid(8);

    const unsub = subscribe(WS_SERVER_EVENTS.REPORT_ACTION_RESPONSE, (payload) => {
      if (payload.requestId === requestId) {
        unsub();
        return res(payload);
      }
    });

    emitSocketEvent({ event: WS_CLIENT_EVENTS.REPORT_ACTION_REQUEST, payload: { ...data, requestId } });

    setTimeout(() => {
      unsub();
      rej("REQUEST_TIMEOUT");
    }, 15000);
  });
});
