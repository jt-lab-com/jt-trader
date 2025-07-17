import { ExchangeMarkets } from "@/entities/markets";
import { SymbolFilters, filterMarketSymbols } from "./filter-market-symbols";

export const getAvailableMarketSymbols = (
  symbols: string[],
  markets: ExchangeMarkets[],
  filters: SymbolFilters
) => {
  const filteredSymbols = filterMarketSymbols(markets, filters);
  return symbols.filter((symbol) => !!filteredSymbols.find((marketSymbol) => marketSymbol.symbol === symbol));
};
