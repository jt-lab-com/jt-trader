import { ExchangeMarkets } from "@/entities/markets";

export interface SymbolFilters {
  search: string;
  minVolume: number;
  minLeverage: number;
}

export const filterMarketSymbols = (markets: ExchangeMarkets[], filters: SymbolFilters) => {
  const { search, minVolume, minLeverage } = filters;

  return markets.filter((row) => {
    const volume = row.quoteVolume ?? 0;
    const maxLeverage = row.limits?.leverage?.max ?? 0;
    return row.symbol.includes(search.toUpperCase()) && volume >= minVolume && maxLeverage >= minLeverage;
  });
};
