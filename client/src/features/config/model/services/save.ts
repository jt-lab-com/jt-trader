import { ExchangeField, WS_CLIENT_EVENTS } from "@packages/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { emitSocketEvent } from "@/shared/api/socket";
import { ThunkConfig } from "@/shared/types/store";

export const saveExchangeConfig = createAsyncThunk<
  void,
  Array<ExchangeField & { value: string | boolean }>,
  ThunkConfig<void>
>("config/saveExchangeConfig", (fields) => {
  emitSocketEvent({
    event: WS_CLIENT_EVENTS.EXCHANGE_CONFIG_SAVE,
    payload: fields,
  });
});
