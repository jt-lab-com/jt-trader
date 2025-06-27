import { WS_CLIENT_EVENTS } from "@packages/types";
import { emitSocketEvent } from "@/shared/api/socket";

export const runJob = (id: number) => {
  emitSocketEvent({ event: WS_CLIENT_EVENTS.RUN_BACKGROUND_JOB_REQUEST, payload: id });
};
