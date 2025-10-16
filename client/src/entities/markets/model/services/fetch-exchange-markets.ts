import { MarketType, WS_CLIENT_EVENTS } from "@packages/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { emitSocketEvent } from "@/shared/api/socket";
import { ThunkConfig } from "@/shared/types/store";

interface FetchExchangeMarketsParams {
  exchange: string;
  marketType: MarketType;
}

export const fetchExchangeMarkets = createAsyncThunk<void, FetchExchangeMarketsParams, ThunkConfig<void>>(
  "markets/fetch-exchange-markets",
  (payload) => {
    emitSocketEvent({ event: WS_CLIENT_EVENTS.EXCHANGE_MARKETS_REQUEST, payload });
  }
);
