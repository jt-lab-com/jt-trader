import { WS_CLIENT_EVENTS, WS_SERVER_EVENTS } from "@packages/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { emitSocketEvent, subscribe } from "@/shared/api/socket";
import { ThunkConfig } from "@/shared/types/store";
import { isStrategyInited } from "../selectors";
import { strategyActions } from "../slice/strategy-slice";

export const initStrategies = createAsyncThunk<void, void, ThunkConfig<void>>(
  "strategy/init",
  async (_, thunkApi) => {
    const { dispatch, getState } = thunkApi;
    const isInited = isStrategyInited(getState());

    if (isInited) return;

    subscribe(WS_SERVER_EVENTS.STRATEGY_LIST_RESPONSE, (payload) => {
      dispatch(
        strategyActions.setLocalStrategies(
          payload.map((localStrategy) => ({ ...localStrategy, type: "local" }))
        )
      );
    });

    subscribe(WS_SERVER_EVENTS.REMOTE_STRATEGY_LIST_RESPONSE, (payload) => {
      dispatch(
        strategyActions.setRemoteBundleStrategies(
          payload.bundles.map((bundle) => ({ ...bundle, type: "bundle" }))
        )
      );
      dispatch(
        strategyActions.setRemoteAppStrategies(
          payload.appBundles.map((appBundle) => ({ ...appBundle, type: "app" }))
        )
      );
    });

    subscribe(WS_SERVER_EVENTS.STRATEGY_CONTENT_RESPONSE, (payload) => {
      dispatch(strategyActions.setStrategyContent(payload));
    });

    emitSocketEvent({
      event: WS_CLIENT_EVENTS.STRATEGY_LIST_REQUEST,
    });

    emitSocketEvent({
      event: WS_CLIENT_EVENTS.REMOTE_STRATEGY_LIST_REQUEST,
    });

    dispatch(strategyActions.setInited());
  }
);
