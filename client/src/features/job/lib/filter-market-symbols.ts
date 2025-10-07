import { ExchangeMarkets } from "@/entities/markets";

export interface SymbolFilters {
  search: string;
  minVolume: number;
  minLeverage: number;
}

export const filterMarketSymbols = (markets: ExchangeMarkets[], filters: SymbolFilters) => {
  const { search, minVolume, minLeverage } = filters;

  return markets.filter((row) => {
    return row.symbol.includes(search.toUpperCase()) && row.quoteVolume
      ? row.quoteVolume >= minVolume
      : row.limits.leverage.max >= minLeverage;
  });
};
