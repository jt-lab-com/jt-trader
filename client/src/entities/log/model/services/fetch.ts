import { WS_CLIENT_EVENTS } from "@packages/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { emitSocketEvent } from "@/shared/api/socket";
import { ThunkConfig } from "@/shared/types/store";

export const fetchLogs = createAsyncThunk<void, string, ThunkConfig<void>>(
  "log/fetch",
  async (artifactsId) => {
    if (!artifactsId) return;
    emitSocketEvent({ event: WS_CLIENT_EVENTS.LOGS_LIST_REQUEST, payload: artifactsId });
  }
);
