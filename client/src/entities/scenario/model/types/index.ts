import { ScenarioExecInfo, Scenario } from "@packages/types";

export interface ScenarioSchema {
  list: Scenario[];
  execInfo: ScenarioExecInfo[];
  __inited: boolean;
}

export interface ScenarioSet {
  id: number;
  args: ScenarioSetArg[];
  artifacts: string;
  status: 0 | 1 | 2 | 3;
}

export interface ScenarioSetArg {
  key: string;
  value: string;
}
