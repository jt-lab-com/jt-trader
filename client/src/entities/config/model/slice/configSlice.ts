import { Exchange, TesterDefaultArgs } from "@packages/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ConfigStateSchema, EngineMode } from "../types";

const initialState: ConfigStateSchema = {
  exchangeList: [],
  engineMode: null,
  engineVersion: null,
  testerDefaults: null,
  __inited: false,
};

const configSlice = createSlice({
  name: "config",
  initialState,
  reducers: {
    setInited: (state) => {
      state.__inited = true;
    },
    setEngineVersion: (state, action: PayloadAction<string>) => {
      state.engineVersion = action.payload;
    },
    setEngineMode: (state, action: PayloadAction<EngineMode>) => {
      state.engineMode = action.payload;
    },
    setExchangeList: (state, action: PayloadAction<Exchange[]>) => {
      state.exchangeList = action.payload;
    },
    setExchangeFieldValue: (
      state,
      action: PayloadAction<{ exchangeName: string; key: string; value: string | boolean }>
    ) => {
      const { exchangeName, key, value } = action.payload;

      const exchange = state.exchangeList.find((exchange) => exchange.name === exchangeName);
      const field = exchange?.fields.find((field) => field.name === key);
      if (!field) return;

      field.value = value;
    },
    setTesterDefaults: (state, action: PayloadAction<TesterDefaultArgs>) => {
      state.testerDefaults = action.payload;
    },
  },
});

export const { actions: configActions } = configSlice;
export const { reducer: configReducer } = configSlice;
