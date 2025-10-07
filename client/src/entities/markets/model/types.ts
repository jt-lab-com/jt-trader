import { ExchangeMarkets as WSExchangeMarkets, MarketType } from "@packages/types";

type ExchangeName = string;

export interface ExchangeMarkets extends WSExchangeMarkets {
  minSizeUSDT: number;
}

export interface MarketsSchema {
  __inited: boolean;
  data: Record<ExchangeName, ExchangeMarketsData>;
}

type ExchangeMarketsData = Record<MarketType, MarketData>;

interface MarketData {
  tms: number;
  markets: ExchangeMarkets[];
}
