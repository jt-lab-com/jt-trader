import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { artifactReducer } from "@/entities/artifact";
import { configReducer } from "@/entities/config";
import { jobReducer } from "@/entities/job";
import { logsReducer } from "@/entities/log";
import { marketsReducer } from "@/entities/markets";
import { scenarioReducer } from "@/entities/scenario";
import { strategyReducer } from "@/entities/strategy";
import { userReducer } from "@/entities/user";
import { StateSchema } from "@/shared/types/store";

const reducers = combineReducers<StateSchema>({
  user: userReducer,
  strategy: strategyReducer,
  job: jobReducer,
  scenario: scenarioReducer,
  markets: marketsReducer,
  artifact: artifactReducer,
  logs: logsReducer,
  config: configReducer,
});

export const store = configureStore({
  reducer: reducers,
  devTools: __DEV__,
});

export type AppDispatch = typeof store.dispatch;
