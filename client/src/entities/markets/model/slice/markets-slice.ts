import { ExchangeMarketsResponsePayload } from "@packages/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ExchangeMarkets, MarketsSchema } from "../types";

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
    setMarkets: (
      state,
      action: PayloadAction<Omit<ExchangeMarketsResponsePayload, "data"> & { data: ExchangeMarkets[] }>
    ) => {
      const { exchange, data, marketType } = action.payload;

      state.data[exchange] = {
        ...state.data[exchange],
        [marketType]: {
          tms: Date.now(),
          markets: data,
        },
      };

      // state.data[exchange] = {
      //   tms: Date.now(),
      //   markets: data,
      // };
    },
  },
});

export const { actions: marketsActions } = marketsSlice;
export const { reducer: marketsReducer } = marketsSlice;
