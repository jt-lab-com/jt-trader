export interface PositionInterface {
  id?: string;
  symbol?: string;
  contracts?: number; // amount base currency (contracts)
  contractSize?: number;
  unrealizedPnl?: number;
  leverage?: number;
  liquidationPrice?: number;
  collateral?: number; // amount quote currency (collateral)
  notional?: number;
  markPrice?: number;
  entryPrice?: number;
  timestamp?: number; // unix timestamp milliseconds
  initialMargin?: number;
  initialMarginPercentage?: number;
  maintenanceMargin?: number;
  maintenanceMarginPercentage?: number;
  marginRatio?: number;
  datetime?: string;
  marginMode?: 'cross' | 'isolated';
  marginType?: 'cross';
  side?: 'short' | 'long' | string;
  hedged?: boolean;
  percentage?: number;
}
