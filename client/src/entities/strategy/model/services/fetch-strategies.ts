import { WS_CLIENT_EVENTS } from "@packages/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { emitSocketEvent } from "@/shared/api/socket";
import { ThunkConfig } from "@/shared/types/store";

export const fetchStrategies = createAsyncThunk<void, void, ThunkConfig<void>>(
  "strategy/fetchStrategies",
  () => {
    emitSocketEvent({ event: WS_CLIENT_EVENTS.STRATEGY_LIST_REQUEST });
    emitSocketEvent({ event: WS_CLIENT_EVENTS.REMOTE_STRATEGY_LIST_REQUEST });
  }
);
