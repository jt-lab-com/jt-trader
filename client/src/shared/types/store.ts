import type { ArtifactSchema } from "@/entities/artifact";
import type { ConfigStateSchema } from "@/entities/config";
import type { JobSchema } from "@/entities/job";
import type { LogsSchema } from "@/entities/log";
import type { MarketsSchema } from "@/entities/markets";
import type { ScenarioSchema } from "@/entities/scenario";
import type { StrategySchema } from "@/entities/strategy";
import type { UserSchema } from "@/entities/user";

export interface StateSchema {
  user: UserSchema;
  strategy: StrategySchema;
  job: JobSchema;
  scenario: ScenarioSchema;
  markets: MarketsSchema;
  artifact: ArtifactSchema;
  logs: LogsSchema;
  config: ConfigStateSchema;
}

export interface ThunkConfig<T> {
  rejectValue: T;
  state: StateSchema;
}
