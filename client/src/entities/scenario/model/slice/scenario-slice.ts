import { createSlice } from "@reduxjs/toolkit";
import { ScenarioSchema } from "../types";

const initialState: ScenarioSchema = {
  list: [],
  execInfo: [],
  __inited: false,
};

const scenarioSlice = createSlice({
  name: "scenario",
  initialState,
  reducers: {
    setInited: (state) => {
      state.__inited = true;
    },
    setScenarioList: (state, action) => {
      state.list = action.payload;
    },
    setScenarioExecInfo: (state, action) => {
      state.execInfo = action.payload;
    },
  },
});

export const { reducer: scenarioReducer } = scenarioSlice;
export const { actions: scenarioActions } = scenarioSlice;
