import { ScenarioExecInfo, Scenario } from "@packages/types";

export interface ScenarioSchema {
  list: Scenario[];
  execInfo: ScenarioExecInfo[];
  __inited: boolean;
}
