import { WS_CLIENT_EVENTS } from "@packages/types";
import { emitSocketEvent } from "@/shared/api/socket";

export const removeJob = (id: number) => {
  emitSocketEvent({ event: WS_CLIENT_EVENTS.REMOVE_BACKGROUND_JOB_REQUEST, payload: id });
};
