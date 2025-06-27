import { ExchangeMarketsResponsePayload } from "@packages/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MarketsSchema } from "../types";

const initialState: MarketsSchema = {
  __inited: false,
  data: {},
};

const marketsSlice = createSlice({
  name: "markets",
  initialState,
  reducers: {
    setInited: (state) => {
      state.__inited = true;
    },
    setMarkets: (state, action: PayloadAction<ExchangeMarketsResponsePayload>) => {
      const { exchange, data } = action.payload;

      state.data[exchange] = {
        tms: Date.now(),
        markets: data,
      };
    },
  },
});

export const { actions: marketsActions } = marketsSlice;
export const { reducer: marketsReducer } = marketsSlice;
