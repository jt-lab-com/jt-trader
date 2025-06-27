import { WS_CLIENT_EVENTS } from "@packages/types";
import { emitSocketEvent } from "@/shared/api/socket";

export const rebootServer = () => {
  emitSocketEvent({ event: WS_CLIENT_EVENTS.REBOOT_SYSTEM_REQUEST });
};
