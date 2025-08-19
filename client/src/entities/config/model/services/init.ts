import { WS_CLIENT_EVENTS, WS_SERVER_EVENTS } from "@packages/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { emitSocketEvent, subscribe } from "@/shared/api/socket";
import { ThunkConfig } from "@/shared/types/store";
import { isConfigInited } from "../../model/selectors";
import { configActions } from "../slice/configSlice";

export const initConfig = createAsyncThunk<void, void, ThunkConfig<void>>(
  "config/initConfig",
  (_, thunkAPI) => {
    const { dispatch, getState } = thunkAPI;

    const isInited = isConfigInited(getState());

    if (isInited) return;

    subscribe(WS_SERVER_EVENTS.EXCHANGE_CONFIG_RESPONSE, (payload) => {
      dispatch(configActions.setExchangeList(payload.exchanges));
    });

    subscribe(WS_SERVER_EVENTS.ENGINE_CONFIG_RESPONSE, (payload) => {
      console.log(`Engine version: ${payload.version}`);
      dispatch(configActions.setEngineVersion(payload.version));
      dispatch(configActions.setTesterDefaults(payload.testerDefaults));
    });

    emitSocketEvent({ event: WS_CLIENT_EVENTS.EXCHANGE_CONFIG_REQUEST });
    emitSocketEvent({ event: WS_CLIENT_EVENTS.ENGINE_CONFIG_REQUEST });

    dispatch(configActions.setInited());
  }
);
