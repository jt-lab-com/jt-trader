import { MarketType } from "@packages/types";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/shared/lib/hooks/useAppDispatch";
import { useDebounce } from "@/shared/lib/hooks/useDebounce";
import { getMarketsData } from "../../model/selectors";
import { fetchExchangeMarkets } from "../../model/services/fetch-exchange-markets";
import { initMarkets } from "../../model/services/init";
import { ExchangeMarkets } from "../../model/types";

export const useMarkets = (exchange: string, marketType: MarketType): ExchangeMarkets[] | null => {
  const dispatch = useAppDispatch();
  const debouncedFetch = useDebounce(() => {
    dispatch(fetchExchangeMarkets({ exchange, marketType }));
  }, 500);

  useEffect(() => {
    dispatch(initMarkets());
  }, []);

  const marketsData = useSelector(getMarketsData(exchange, marketType));

  if (exchange) {
    if (!marketsData || Date.now() - marketsData.tms > 1000 * 60 * 60) {
      debouncedFetch();
    }
  }

  return marketsData?.markets ?? null;
};
