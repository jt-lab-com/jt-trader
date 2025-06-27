import { WS_CLIENT_EVENTS } from "@packages/types";
import { emitSocketEvent } from "@/shared/api/socket";

export const runScenario = (scenarioId: number, sync?: boolean) => {
  const event = sync ? WS_CLIENT_EVENTS.RUN_TESTER_SCENARIO_SYNC : WS_CLIENT_EVENTS.RUN_TESTER_SCENARIO;
  emitSocketEvent({ event, payload: scenarioId });
};
