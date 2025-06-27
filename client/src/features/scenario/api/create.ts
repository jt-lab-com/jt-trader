import { CreateScenarioParams, WS_CLIENT_EVENTS } from "@packages/types";
import { emitSocketEvent } from "@/shared/api/socket";

export const createScenario = (scenario: CreateScenarioParams) => {
  emitSocketEvent({
    event: WS_CLIENT_EVENTS.CREATE_TESTER_SCENARIO,
    payload: scenario,
  });
};
