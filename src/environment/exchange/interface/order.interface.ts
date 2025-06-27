import { Order, Fee, Trade } from 'ccxt';

export type OrderType = 'market' | 'limit';
export type OrderSide = 'sell' | 'buy';

export enum PositionSideType {
  long = 'long',
  short = 'short',
  both = 'both',
}

export interface OrderInterface {
  /*extends Order*/
  id?: string;
  error?: string;
  clientOrderId?: string;
  datetime?: string;
  timestamp?: number;
  lastTradeTimestamp?: number;
  status?: 'open' | 'closed' | 'canceled' | 'untriggered' | string;
  symbol?: string;
  type?: string;
  timeInForce?: string;
  side?: 'buy' | 'sell' | string;
  positionSide?: PositionSideType;
  price?: number;
  stopLossPrice?: number;
  takeProfitPrice?: number;
  triggerPrice?: number;
  average?: number;
  amount?: number;
  filled?: number;
  remaining?: number;
  cost?: number;
  trades?: Trade[];
  fee?: Fee;
  info?: any;
  reduceOnly?: boolean;
}

export interface OrderDTOInterface {
  symbol: string;
  type: OrderType;
  side: OrderSide;
}
