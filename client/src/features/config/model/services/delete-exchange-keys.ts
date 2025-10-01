import { WS_CLIENT_EVENTS } from "@packages/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { emitSocketEvent } from "@/shared/api/socket";
import { ThunkConfig } from "@/shared/types/store";

export const deleteExchangeKeys = createAsyncThunk<void, string[], ThunkConfig<void>>(
  "config/deleteExchangeKeys",
  async (fields) => {
    emitSocketEvent({
      event: WS_CLIENT_EVENTS.EXCHANGE_CONFIG_DELETE,
      payload: fields,
    });
  }
);
