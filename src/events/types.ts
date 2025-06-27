import { Socket } from 'socket.io';
import { UserAuthData } from '../common/api/types';

export type SocketClient = Socket & { user: UserAuthData };

export interface UserConnections {
  socketClients: SocketClient[];
  exchangeTickerSubscribes: ExchangeTickerSubscribeParams[];
}

export interface AuthUserResult {
  error: boolean;
  data: UserAuthData | null;
}

export interface ExchangeTickerSubscribeParams {
  exchange: string;
  symbol: string;
  datafeedSubId: number;
  clientListenerId: string;
}
