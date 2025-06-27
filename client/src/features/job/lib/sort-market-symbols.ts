import { ExchangeMarkets } from "@packages/types";
import { SortOrder } from "@/shared/types";

interface SortMarketSymbolsOptions {
  selectedSymbols: string[];
  order: SortOrder;
  orderBy: "symbol" | "quoteVolume" | "limits.leverage.max";
}

export const sortMarketSymbols = (markets: ExchangeMarkets[], sortOptions: SortMarketSymbolsOptions) => {
  const { selectedSymbols, orderBy, order } = sortOptions;

  return markets.sort((a, b) => {
    if (selectedSymbols.includes(a.symbol) !== selectedSymbols.includes(b.symbol)) {
      if (selectedSymbols.includes(b.symbol)) return 1;
      return -1;
    }

    const isAsc = order === "asc";

    if (orderBy === "symbol") {
      return isAsc ? a.symbol.localeCompare(b.symbol) : b.symbol.localeCompare(a.symbol);
    }

    if (orderBy === "quoteVolume") {
      if (!a.quoteVolume && b.quoteVolume) return 1;
      if (!b.quoteVolume && a.quoteVolume) return -1;
      if (!a.quoteVolume && !b.quoteVolume) return 0;
      return (a.quoteVolume - b.quoteVolume) * (isAsc ? -1 : 1);
    }

    if (orderBy === "limits.leverage.max") {
      if (!a.limits.leverage.max && b.limits.leverage.max) return 1;
      if (!b.limits.leverage.max && a.limits.leverage.max) return -1;
      if (!a.limits.leverage.max && !b.limits.leverage.max) return 0;
      return (a.limits.leverage.max - b.limits.leverage.max) * (isAsc ? -1 : 1);
    }

    return 0;
  });
};
