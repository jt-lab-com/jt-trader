import { IChartApi } from "lightweight-charts";
import { FC, useEffect, useRef } from "react";
import { TVChartLight } from "@/shared/ui/tv-chart-light";
import { TVChartDatafeed } from "../../../lib/trading-view/tv-chart/datafeed";
import { TradingViewChartData } from "../../../model/types";

interface TradingViewChartProps {
  data: TradingViewChartData;
}

export const TradingViewChart: FC<TradingViewChartProps> = (props) => {
  const { data } = props;

  const chartRef = useRef<IChartApi | null>(null);
  const datafeedRef = useRef<TVChartDatafeed | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    datafeedRef.current = new TVChartDatafeed(chartRef.current);
    void datafeedRef.current.loadChart(data);
  }, [chartRef.current]);

  return (
    <TVChartLight
      sx={{ height: data.height ?? 500 }}
      chartRef={chartRef}
      chartOptions={{ height: data.height, width: data.width }}
    />
  );
};
