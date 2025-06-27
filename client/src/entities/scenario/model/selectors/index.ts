import { StateSchema } from "@/shared/types/store";

export const isScenarioInited = (state: StateSchema) => state.scenario.__inited;
export const getScenarioList = (state: StateSchema) => state.scenario.list;
export const getScenarioExecInfo = (state: StateSchema) => state.scenario.execInfo;
