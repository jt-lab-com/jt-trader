import { WS_CLIENT_EVENTS } from "@packages/types";
import { emitSocketEvent } from "@/shared/api/socket";

export const stopAllScenarios = () => {
  emitSocketEvent({ event: WS_CLIENT_EVENTS.STOP_ALL_TESTER_SCENARIO });
};
