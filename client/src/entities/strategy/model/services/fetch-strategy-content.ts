import { WS_CLIENT_EVENTS } from "@packages/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { emitSocketEvent } from "@/shared/api/socket";
import { ThunkConfig } from "@/shared/types/store";

export const fetchStrategyContent = createAsyncThunk<void, string, ThunkConfig<void>>(
  "strategy/fetchStrategyContent",
  (id) => {
    emitSocketEvent({
      event: WS_CLIENT_EVENTS.STRATEGY_CONTENT_REQUEST,
      payload: id,
    });
  }
);
