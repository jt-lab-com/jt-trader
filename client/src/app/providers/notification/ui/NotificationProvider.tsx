import { WS_SERVER_EVENTS } from "@packages/types";
import { useSnackbar } from "notistack";
import { FC, ReactNode, useEffect } from "react";
import { subscribe } from "@/shared/api/socket";

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: FC<NotificationProviderProps> = (props) => {
  const { children } = props;

  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const unsub = subscribe(WS_SERVER_EVENTS.CLIENT_NOTIFICATION, (payload) => {
      enqueueSnackbar({ message: payload.message, variant: payload.type });
    });

    return () => {
      unsub();
    };
  }, []);

  return children;
};
