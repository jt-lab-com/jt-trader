import { CandleStick } from "@packages/types";
import dayjs from "dayjs";
import {
  CandlestickSeries,
  createSeriesMarkers,
  IChartApi,
  IPriceLine,
  ISeriesApi,
  ISeriesMarkersPluginApi,
  LineStyle,
  SeriesMarker,
  Time,
  UTCTimestamp,
} from "lightweight-charts";
import { HistoryBarsLoader } from "@/shared/api/history-bars-loader";
import { roundTimeByTimeframe } from "@/shared/lib/utils/timeframe";
import { PlaybackChartPriceLine, PlaybackChartShape, PlaybackChartSymbolData } from "../../model/types";
import { chartEvents } from "./events";
import { ChartPlayer, ChartPlayerSpeed } from "./player";

const resolutionMsMap: Record<string, number> = {
  ["1"]: 1000 * 60,
  ["5"]: 1000 * 60 * 5,
  ["15"]: 1000 * 60 * 15,
  ["60"]: 1000 * 60 * 60,
  ["240"]: 1000 * 60 * 60 * 4,
  ["1D"]: 1000 * 60 * 60 * 24,
};

interface ChartPlaybackParams {
  chart: IChartApi;
  s3Host: string;
}

interface LoadChartParams extends PlaybackChartSymbolData {
  defaultSpeed?: ChartPlayerSpeed;
}

type UserPriceLineId = string;

export class ChartPlaybackDatafeed {
  private readonly chart: IChartApi;
  private readonly barsLoader: HistoryBarsLoader;
  private candleStickSeries: ISeriesApi<"Candlestick"> | null = null;
  private seriesMarkers: ISeriesMarkersPluginApi<Time> | null = null;
  private renderedPriceLinesMap: Record<UserPriceLineId, IPriceLine> = {};
  private player: ChartPlayer | null = null;

  constructor(params: ChartPlaybackParams) {
    this.chart = params.chart;
    this.barsLoader = new HistoryBarsLoader(params.s3Host);

    chartEvents.on("play", () => {
      this.player?.play();
    });
    chartEvents.on("pause", () => {
      this.player?.pause();
    });
    chartEvents.on("speedChange", (speed: string) => {
      this.player?.changeSpeed(speed);
    });
    chartEvents.on("close", () => {
      chartEvents.removeAllListeners();
    });
  }

  async loadChart(params: LoadChartParams) {
    const {
      symbol,
      interval,
      startTime,
      endTime,
      defaultSpeed = ChartPlayerSpeed.x1,
      shapes,
      priceLines,
      visibleRange,
    } = params;

    const shapesMap = shapes?.reduce<Record<number, PlaybackChartShape[]>>((acc, shape) => {
      const timeframeMs = resolutionMsMap[interval];
      const timeframeMinutes = timeframeMs / 1000 / 60;
      const timestamp = roundTimeByTimeframe(shape.renderTime, timeframeMinutes);

      if (acc[timestamp]) {
        acc[timestamp].push(shape);
        return acc;
      }

      acc[timestamp] = [shape];

      return acc;
    }, {});

    const priceLinesMap = priceLines?.reduce<Record<number, PlaybackChartPriceLine[]>>((acc, line) => {
      const timeframeMs = resolutionMsMap[interval];
      const timeframeMinutes = timeframeMs / 1000 / 60;
      const timestamp = roundTimeByTimeframe(line.renderTime, timeframeMinutes);

      if (acc[timestamp]) {
        acc[timestamp].push(line);
        return acc;
      }

      acc[timestamp] = [line];
      return acc;
    }, {});

    const history = await this.loadHistory(symbol, interval, startTime);

    if (!this.candleStickSeries) {
      this.candleStickSeries = this.chart.addSeries(CandlestickSeries);
    }

    if (!this.seriesMarkers) {
      this.seriesMarkers = createSeriesMarkers(this.candleStickSeries, []);
    }

    this.candleStickSeries.setData(history);
    this.seriesMarkers?.setMarkers([]);

    if (visibleRange)
      this.chart.timeScale().setVisibleRange({
        from: (visibleRange.from / 1000) as UTCTimestamp,
        to: (visibleRange.to / 1000) as UTCTimestamp,
      });

    const onTick = (candle: CandleStick) => {
      if (!this.candleStickSeries) return;

      this.candleStickSeries.update({ ...candle, time: (candle.time / 1000) as UTCTimestamp });

      if (shapesMap?.[candle.time]) {
        const shapes = shapesMap[candle.time].map(
          (shape) =>
            ({
              time: shape.renderTime / 1000,
              shape: shape.shape ?? "circle",
              position: shape.position,
              color: shape.options?.color,
              text: shape.text,
              size: shape.options?.size,
            } as SeriesMarker<Time>)
        );

        delete shapesMap[candle.time];

        const prevShapes = this.seriesMarkers?.markers();
        this.seriesMarkers?.setMarkers([...(prevShapes ?? []), ...shapes]);
      }

      if (priceLinesMap?.[candle.time]) {
        const priceLinesData = priceLinesMap[candle.time].map((line) => ({
          id: line.id,
          price: line.price,
          title: line.title,
          color: line.options?.color ?? "black",
          lineWidth: line.options?.lineWidth ?? 2,
          lineStyle: line.options?.lineStyle ?? LineStyle.Dashed,
          axisLabelVisible: line.options?.axisLabelVisible ?? true,
        }));

        delete priceLinesMap[candle.time];

        for (const lineData of priceLinesData) {
          if (lineData.id && this.renderedPriceLinesMap[lineData.id]) {
            this.candleStickSeries.removePriceLine(this.renderedPriceLinesMap[lineData.id]);
          }

          const priceLine = this.candleStickSeries.createPriceLine(lineData);

          if (lineData.id) {
            this.renderedPriceLinesMap[lineData.id] = priceLine;
          }
        }
      }
    };

    const candles = await this.barsLoader.getBars(symbol, interval, startTime, endTime);
    this.player = new ChartPlayer({
      candles: candles.filter((candle) => candle.time <= endTime),
      onTick,
      defaultSpeed,
    });
  }

  private async loadHistory(symbol: string, interval: string, timeTo: number) {
    const from = dayjs(timeTo)
      .subtract(interval.includes("D") ? 6 : 1, "month")
      .toDate()
      .getTime();

    const candles = await this.barsLoader.getBars(symbol, interval, from, timeTo);
    return candles.map((candle) => ({ ...candle, time: (candle.time / 1000) as UTCTimestamp }));
  }
}
