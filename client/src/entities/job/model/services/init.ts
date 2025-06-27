import { WS_CLIENT_EVENTS, WS_SERVER_EVENTS } from "@packages/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { emitSocketEvent, subscribe } from "@/shared/api/socket";
import { ThunkConfig } from "@/shared/types/store";
import { isJobsInited } from "../selectors";
import { jobActions } from "../slices/job-slice";

export const initJobs = createAsyncThunk<void, void, ThunkConfig<void>>("job/init", (_, thunkAPI) => {
  const { dispatch, getState } = thunkAPI;

  const isInited = isJobsInited(getState());

  if (isInited) return;

  emitSocketEvent({ event: WS_CLIENT_EVENTS.BACKGROUND_JOBS_LIST_REQUEST });

  subscribe(WS_SERVER_EVENTS.BACKGROUND_JOBS_LIST_RESPONSE, (payload) => {
    dispatch(jobActions.setJobs(payload));
  });

  dispatch(jobActions.setInited());
});
