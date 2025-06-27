import { WS_CLIENT_EVENTS } from "@packages/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { emitSocketEvent } from "@/shared/api/socket";
import { ThunkConfig } from "@/shared/types/store";

export const fetchJobs = createAsyncThunk<void, void, ThunkConfig<void>>("job/fetch", () => {
  emitSocketEvent({ event: WS_CLIENT_EVENTS.BACKGROUND_JOBS_LIST_REQUEST });
});
