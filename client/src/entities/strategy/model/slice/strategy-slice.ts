import { Strategy, StrategyContentResponsePayload } from "@packages/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { StrategySchema } from "../types";

const initialState: StrategySchema = {
  localStrategies: [],
  remoteBundleStrategies: [],
  remoteAppStrategies: [],
  strategyContent: {},
  __inited: false,
};

export const strategySlice = createSlice({
  name: "strategies",
  initialState,
  reducers: {
    setInited: (state) => {
      state.__inited = true;
    },
    setLocalStrategies: (state, action: PayloadAction<Strategy[]>) => {
      state.localStrategies = action.payload;
    },
    setRemoteBundleStrategies: (state, action: PayloadAction<Strategy[]>) => {
      state.remoteBundleStrategies = action.payload;
    },
    setRemoteAppStrategies: (state, action: PayloadAction<Strategy[]>) => {
      state.remoteAppStrategies = action.payload;
    },
    setStrategyContent: (state, action: PayloadAction<StrategyContentResponsePayload>) => {
      if (!action.payload) return;
      const { strategy, content } = action.payload;
      state.strategyContent[strategy] = content;
    },
  },
});

export const { reducer: strategyReducer } = strategySlice;
export const { actions: strategyActions } = strategySlice;
