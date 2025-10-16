import { Socket } from 'socket.io';
import { UserAuthData } from '../common/api/types';
import { MarketType } from '@packages/types';

export type SocketClient = Socket & { user: UserAuthData };

export interface UserConnections {
  socketClients: SocketClient[];
  exchangeTickerSubscribes: ExchangeTickerSubscribeParams[];
}

export interface AuthUserResult {
  error: boolean;
  errorCode?: number;
  data: UserAuthData | null;
}

export interface ExchangeTickerSubscribeParams {
  exchange: string;
  marketType: MarketType;
  symbol: string;
  datafeedSubId: number;
  clientListenerId: string;
}
