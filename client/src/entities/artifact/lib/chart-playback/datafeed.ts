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
import {
  PlaybackChartCard,
  PlaybackChartPriceLine,
  PlaybackChartShape,
  PlaybackChartSymbolData,
} from "../../model/types";
import { chartEvents, Events } from "./events";
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
type Drawable = PlaybackChartShape | PlaybackChartPriceLine | PlaybackChartCard;
type DrawableMap<T extends Drawable> = Record<number, T[]>;

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

    chartEvents.on(Events.Play, () => {
      this.player?.play();
    });
    chartEvents.on(Events.Pause, () => {
      this.player?.pause();
    });
    chartEvents.on(Events.SpeedChange, (speed: string) => {
      this.player?.changeSpeed(speed);
    });
    chartEvents.on(Events.Close, () => {
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
      cards,
      visibleRange,
    } = params;

    let shapesMap: DrawableMap<PlaybackChartShape>;
    let priceLinesMap: DrawableMap<PlaybackChartPriceLine>;
    let cardsMap: DrawableMap<PlaybackChartCard>;

    if (shapes) shapesMap = shapesMap = this.groupDrawablesByTime(shapes, interval);
    if (priceLines) priceLinesMap = this.groupDrawablesByTime(priceLines, interval);
    if (cards) cardsMap = this.groupDrawablesByTime(cards, interval);

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
      this.candleStickSeries.update({ ...candle, time: (candle.time / 1000) as Time });

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

      if (cardsMap?.[candle.time]) {
        for (const card of cardsMap[candle.time]) {
          chartEvents.emit(Events.CardValueChange, card.id, card.value);
        }
      }

      chartEvents.emit(Events.Tick, candle);
    };

    const candles = await this.barsLoader.getBars(symbol, interval, startTime, endTime);
    this.player = new ChartPlayer({
      candles: candles.filter((candle) => candle.time <= endTime),
      onTick,
      defaultSpeed,
    });
  }

  private groupDrawablesByTime<T extends Drawable>(data: T[], interval: string): DrawableMap<T> {
    return data.reduce<Record<number, T[]>>((acc, item) => {
      const timeframeMs = resolutionMsMap[interval];
      const timeframeMinutes = timeframeMs / 1000 / 60;
      const timestamp = roundTimeByTimeframe(item.renderTime, timeframeMinutes);

      if (acc[timestamp]) {
        acc[timestamp].push(item);
        return acc;
      }

      acc[timestamp] = [item];
      return acc;
    }, {});
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
