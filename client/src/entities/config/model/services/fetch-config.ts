import { WS_CLIENT_EVENTS } from "@packages/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { emitSocketEvent } from "@/shared/api/socket";

export const fetchConfig = createAsyncThunk("config/fetchConfig", () => {
  emitSocketEvent({ event: WS_CLIENT_EVENTS.ENGINE_CONFIG_REQUEST });
});
