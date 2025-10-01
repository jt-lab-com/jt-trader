import {
  CandlestickSeries,
  LineSeries,
  createSeriesMarkers,
  IChartApi,
  LineStyle,
  SeriesMarker,
  Time,
  UTCTimestamp,
  LineData,
} from "lightweight-charts";
import { TradingViewChartData } from "../../../model/types";
import { TVChartDatafeedBase } from "../datafeed.base";

export class TVChartDatafeed extends TVChartDatafeedBase {
  constructor(chart: IChartApi) {
    super(chart);
  }

  async loadChart(data: TradingViewChartData) {
    const {
      symbol,
      startTime,
      endTime,
      interval,
      shapes,
      visibleRange,
      priceLines,
      indicators,
      oscillators,
    } = data;

    const markers: SeriesMarker<Time>[] =
      shapes?.map((shape) => ({
        time: shape.renderTime as Time,
        shape: shape.shape ?? "circle",
        position: shape.position,
        color: shape.options?.color ?? "red",
        text: shape.text,
        size: shape.options?.size,
      })) ?? [];

    this.candleStickSeries = this.chart.addSeries(CandlestickSeries);
    this.seriesMarkers = createSeriesMarkers(this.candleStickSeries, markers);

    const history = await this.loadHistory(symbol, interval, startTime, endTime);
    this.candleStickSeries.setData(history);

    priceLines?.forEach((line) => {
      this.candleStickSeries?.createPriceLine({
        id: line.id,
        price: line.price,
        title: line.title,
        color: line.options?.color ?? "black",
        lineWidth: line.options?.lineWidth ?? 2,
        lineStyle: line.options?.lineStyle ?? LineStyle.Dashed,
        axisLabelVisible: line.options?.axisLabelVisible ?? true,
      });
    });

    indicators?.forEach((indicator) => {
      const lineSeries = this.chart.addSeries(LineSeries, {
        color: indicator.color,
        lineWidth: indicator.lineWidth,
        lineStyle: indicator.lineStyle,
        lineType: indicator.lineType,
      });
      const data = indicator.data.map((item) => ({
        time: item.time / 1000,
        value: item.value,
      }));
      lineSeries.setData(data as LineData[]);
    });

    oscillators?.forEach((oscillator) => {
      const lineSeries = this.chart.addSeries(
        LineSeries,
        {
          color: oscillator.color,
          lineWidth: oscillator.lineWidth,
          lineStyle: oscillator.lineStyle,
          lineType: oscillator.lineType,
        },
        1
      );
      const data = oscillator.data.map((item) => ({ time: item.time / 1000, value: item.value }));
      lineSeries.setData(data as LineData[]);
    });

    if (visibleRange) {
      this.chart.timeScale().setVisibleRange({
        from: (visibleRange.from / 1000) as UTCTimestamp,
        to: (visibleRange.to / 1000) as UTCTimestamp,
      });
    }
  }
}
