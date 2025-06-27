import { WS_CLIENT_EVENTS } from "@packages/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { emitSocketEvent } from "@/shared/api/socket";
import { ThunkConfig } from "@/shared/types/store";

export const fetchExchangeMarkets = createAsyncThunk<void, string, ThunkConfig<void>>(
  "markets/fetch-exchange-markets",
  (exchange) => {
    emitSocketEvent({ event: WS_CLIENT_EVENTS.EXCHANGE_MARKETS_REQUEST, payload: exchange });
  }
);
