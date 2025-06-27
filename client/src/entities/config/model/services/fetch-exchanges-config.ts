import { WS_CLIENT_EVENTS } from "@packages/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { emitSocketEvent } from "@/shared/api/socket";

export const fetchExchangesConfig = createAsyncThunk("config/fetchExchangesConfig", () => {
  emitSocketEvent({ event: WS_CLIENT_EVENTS.EXCHANGE_CONFIG_REQUEST });
});
