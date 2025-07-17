import { ExchangeMarkets as WSExchangeMarkets } from "@packages/types";

type ExchangeName = string;

export interface ExchangeMarkets extends WSExchangeMarkets {
  minSizeUSDT: number;
}

export interface MarketsSchema {
  __inited: boolean;
  data: Record<ExchangeName, ExchangeMarketsData>;
}

interface ExchangeMarketsData {
  tms: number;
  markets: ExchangeMarkets[];
}
