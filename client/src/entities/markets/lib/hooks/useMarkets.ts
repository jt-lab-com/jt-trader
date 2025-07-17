import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/shared/lib/hooks/useAppDispatch";
import { getMarketsData } from "../../model/selectors";
import { fetchExchangeMarkets } from "../../model/services/fetch-exchange-markets";
import { initMarkets } from "../../model/services/init";
import { ExchangeMarkets } from "../../model/types";

export const useMarkets = (exchange: string): ExchangeMarkets[] | null => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(initMarkets());
  }, []);

  const marketsData = useSelector(getMarketsData(exchange));

  if (exchange) {
    if (!marketsData || Date.now() - marketsData.tms > 1000 * 60 * 60) {
      dispatch(fetchExchangeMarkets(exchange));
    }
  }

  return marketsData?.markets ?? null;
};
