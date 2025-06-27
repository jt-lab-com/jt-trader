import { WS_CLIENT_EVENTS } from "@packages/types";
import { emitSocketEvent } from "@/shared/api/socket";

export const removeScenario = (scenarioId: number) => {
  emitSocketEvent({
    event: WS_CLIENT_EVENTS.REMOVE_TESTER_SCENARIO,
    payload: scenarioId,
  });
};
