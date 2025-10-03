import { MarketType } from '@packages/types';

export type StrategyArgsType = {
  connectionName: string;
  symbols: string[];
  marketType: MarketType;
  [key: string]: any;
};
