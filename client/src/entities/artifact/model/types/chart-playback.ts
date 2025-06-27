export interface PlaybackChartSymbolData {
  startTime: number;
  endTime: number;
  symbol: string;
  interval: string;
  visibleRange?: PlaybackChartVisibleRange;
  shapes?: PlaybackChartShape[];
}

export interface PlaybackChartVisibleRange {
  from: number;
  to: number;
}

export interface PlaybackChartShape {
  id?: string;
  shape?: "circle" | "square" | "arrowUp" | "arrowDown";
  text?: string;
  renderTime: number;
  position: "aboveBar" | "belowBar" | "inBar";
  options?: PlaybackChartShapeOptions;
}

export interface PlaybackChartShapeOptions {
  color?: string;
  size?: number;
}
