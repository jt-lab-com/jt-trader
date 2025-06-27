import { WS_CLIENT_EVENTS } from "@packages/types";
import { emitSocketEvent } from "@/shared/api/socket";

export const stopJob = (id: number) => {
  emitSocketEvent({ event: WS_CLIENT_EVENTS.STOP_BACKGROUND_JOB_REQUEST, payload: id });
};
