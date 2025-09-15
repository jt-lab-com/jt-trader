import dayjs from "dayjs";
import {
  CandlestickData,
  IChartApi,
  ISeriesApi,
  ISeriesMarkersPluginApi,
  Time,
  UTCTimestamp,
} from "lightweight-charts";
import { HistoryBarsLoader } from "@/shared/api/history-bars-loader";

export class TVChartDatafeedBase {
  protected readonly chart: IChartApi;
  protected readonly barsLoader: HistoryBarsLoader;
  protected candleStickSeries: ISeriesApi<"Candlestick"> | null = null;
  protected seriesMarkers: ISeriesMarkersPluginApi<Time> | null = null;

  constructor(chart: IChartApi) {
    this.chart = chart;
    this.barsLoader = new HistoryBarsLoader();
  }

  protected async loadHistory(
    symbol: string,
    interval: string,
    startTime: number,
    endTime: number
  ): Promise<CandlestickData[]>;
  protected async loadHistory(symbol: string, interval: string, timeTo: number): Promise<CandlestickData[]>;
  protected async loadHistory(symbol: string, interval: string, time1: number, time2?: number) {
    let startTime = time1;
    const endTime = time2 ?? time1;

    if (!time2) {
      startTime = dayjs(time1)
        .subtract(interval.includes("D") ? 6 : 1, "month")
        .toDate()
        .getTime();
    }

    const candles = await this.barsLoader.getBars(symbol, interval, startTime, endTime);
    return candles.map((candle) => ({ ...candle, time: (candle.time / 1000) as UTCTimestamp }));
  }
}
