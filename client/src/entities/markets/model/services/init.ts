import { WS_SERVER_EVENTS } from "@packages/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { subscribe } from "@/shared/api/socket";
import { ThunkConfig } from "@/shared/types/store";
import { isMarketsInited } from "../selectors";
import { marketsActions } from "../slice/markets-slice";

export const initMarkets = createAsyncThunk<void, void, ThunkConfig<void>>("markets/init", (_, thunkAPI) => {
  const { dispatch, getState } = thunkAPI;

  const isInited = isMarketsInited(getState());
  if (isInited) return;

  subscribe(WS_SERVER_EVENTS.EXCHANGE_MARKETS_RESPONSE, (payload) => {
    payload.data.forEach((market) => {
      market.minSizeUSDT = market.contractSize * market.close * market.precision.amount;
    });

    dispatch(marketsActions.setMarkets(payload));
  });

  dispatch(marketsActions.setInited());
});
