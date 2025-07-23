import {
  WS_AUTH_ERROR_CODE,
  WS_CLIENT_EVENT_PAYLOAD,
  WS_CLIENT_EVENTS,
  WS_SERVER_EVENT_PAYLOAD,
  WS_SERVER_EVENTS,
} from "@packages/types";
import socketIO, { Socket } from "socket.io-client";
import config from "../config/app-config";

type EmitEvent = <T extends WS_CLIENT_EVENTS>(event: {
  event: T;
  payload?: WS_CLIENT_EVENT_PAYLOAD[T];
}) => void;

type SubscribeEvent = <T extends WS_SERVER_EVENTS>(
  event: T,
  callback: (payload: WS_SERVER_EVENT_PAYLOAD[T]) => void
) => () => void;

let _events: object[] = [];
const _subscribers = new Set<[event: string, callback: (payload: never) => void]>([]);

let _socket: Socket;
let _socketAuth = false;

interface WsConnectOptions {
  forceReconnect?: boolean;
  accessSecret?: string;
  onAuthSuccess(payload: { id: number; email: string; engineMode: string }): void;
  onAuthRejected(payload: { code: WS_AUTH_ERROR_CODE }): void;
}

export const wsConnect = (authToken: string, options: WsConnectOptions) => {
  const { onAuthSuccess, onAuthRejected, forceReconnect, accessSecret } = options;

  if (_socket && !forceReconnect) {
    if (!_socket.connected) return;
    _socket.connect();
    return;
  }

  if (forceReconnect && _socket) {
    _socket.disconnect();
  }

  _socket = socketIO(config.wsHost, {
    transports: ["websocket"],
    auth: { accessToken: authToken, accessSecret },
  });

  _socket.on("error", (err) => {
    console.error(err);
  });

  _socket.on("disconnect", () => {
    if (__DEV__) console.log("ws disconnected");
  });

  _socket.on("message", ({ event, payload }: { event: string; payload: never }) => {
    if (event === "unauthorized") {
      onAuthRejected(payload);
    }

    if (event === WS_SERVER_EVENTS.AUTHENTICATED) {
      onAuthSuccess(payload);
      if (__DEV__) console.log("ws connected");
      _socketAuth = true;
      _events.forEach((event) => {
        _socket.emit("message", event);
      });
      _events = [];
    }

    _subscribers.forEach(([e, callback]) => {
      if (e === event) callback(payload);
    });
  });
};

export const emitSocketEvent: EmitEvent = (event) => {
  if (event.event !== WS_CLIENT_EVENTS.LOGIN && !_socketAuth) {
    _events.push(event);
    return;
  }

  if (__DEV__) console.log(`ws emit event:`, event);

  _socket?.emit("message", event);
};

export const subscribe: SubscribeEvent = (event, callback) => {
  if (__DEV__) console.log(`ws subscribe: ${event}`);
  const tuple: [event: string, callback: (payload: never) => void] = [event, callback];
  _subscribers.add(tuple);

  return () => {
    if (__DEV__) console.log(`ws unsubscribe: ${event}`);
    _subscribers.delete(tuple);
  };
};
