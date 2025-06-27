import { ExchangeMarkets } from "@packages/types";

type ExchangeName = string;

export interface MarketsSchema {
  __inited: boolean;
  data: Record<ExchangeName, ExchangeMarketsData>;
}

interface ExchangeMarketsData {
  tms: number;
  markets: ExchangeMarkets[];
}
