import { WS_CLIENT_EVENTS, WS_SERVER_EVENTS } from "@packages/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { emitSocketEvent, subscribe } from "@/shared/api/socket";
import { ThunkConfig } from "@/shared/types/store";
import { isScenarioInited } from "../selectors";
import { scenarioActions } from "../slice/scenario-slice";

export const initScenario = createAsyncThunk<void, void, ThunkConfig<void>>(
  "scenario/init",
  (_, thunkAPI) => {
    const { dispatch, getState } = thunkAPI;
    const isInited = isScenarioInited(getState());

    if (isInited) return;

    subscribe(WS_SERVER_EVENTS.TESTER_SCENARIO_LIST_RESPONSE, (data) => {
      dispatch(scenarioActions.setScenarioList(data));
    });

    subscribe(WS_SERVER_EVENTS.TESTER_SCENARIO_EXEC_INFO, (data) => {
      dispatch(scenarioActions.setScenarioExecInfo(data));
    });

    emitSocketEvent({ event: WS_CLIENT_EVENTS.TESTER_SCENARIO_LIST_REQUEST });

    dispatch(scenarioActions.setInited());
  }
);
