import { CopyJobParams, SaveJobParams, WS_CLIENT_EVENTS } from "@packages/types";
import { emitSocketEvent } from "@/shared/api/socket";

export const saveJob = (job: SaveJobParams | CopyJobParams) => {
  emitSocketEvent({
    event: WS_CLIENT_EVENTS.SAVE_BACKGROUND_JOB_REQUEST,
    payload: job,
  });
};
