import { createSlice } from "@reduxjs/toolkit";
import { JobSchema } from "../types";

const initialState: JobSchema = {
  list: [],
  __inited: false,
};

const jobSlice = createSlice({
  name: "jobs",
  initialState,
  reducers: {
    setInited: (state) => {
      state.__inited = true;
    },
    setJobs: (state, action) => {
      state.list = action.payload;
    },
  },
});

export const { actions: jobActions } = jobSlice;
export const { reducer: jobReducer } = jobSlice;
