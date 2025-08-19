import { LineStyle, LineWidth } from "lightweight-charts";

export interface PlaybackChartSymbolData {
  startTime: number;
  endTime: number;
  symbol: string;
  interval: string;
  visibleRange?: PlaybackChartVisibleRange;
  shapes?: PlaybackChartShape[];
  priceLines?: PlaybackChartPriceLine[];
  cards?: PlaybackChartCard[];
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

export interface PlaybackChartPriceLine {
  id?: string;
  renderTime: number;
  price: number;
  title: string;
  options?: PlaybackChartPriceLineOptions;
}

export interface PlaybackChartPriceLineOptions {
  color?: string;
  lineWidth?: LineWidth;
  lineStyle?: LineStyle;
  axisLabelVisible?: boolean;
}

export type PlaybackChartCard<T extends CardType = CardType> = T extends CardType.Text
  ? PlaybackChartTextCard
  : T extends CardType.Formula
  ? PaybackChartFormulaCard
  : T extends CardType.Date
  ? PlaybackChartDateCard
  : T extends CardType.Currency
  ? PlaybackChartCurrencyCard
  : never;

interface PlaybackChartBaseCard {
  id?: string;
  title: string;
  renderTime: number;
}

interface PlaybackChartTextCard extends PlaybackChartBaseCard {
  type: CardType.Text;
  value: string;
  options?: TextOptions;
}

export interface TextOptions {}

interface PaybackChartFormulaCard extends PlaybackChartBaseCard {
  type: CardType.Formula;
  value: string;
  options?: FormulaOptions;
}

export interface FormulaOptions {
  precision?: number;
  prefix?: string;
  suffix?: string;
}

interface PlaybackChartDateCard extends PlaybackChartBaseCard {
  type: CardType.Date;
  value: number | string;
  options?: DateOptions;
}

export interface DateOptions {
  format?: string;
}

interface PlaybackChartCurrencyCard extends PlaybackChartBaseCard {
  type: CardType.Currency;
  value: number;
  options?: CurrencyOptions;
}

export interface CurrencyOptions {
  currency?: string;
}

export enum CardType {
  Text = "text",
  Formula = "formula",
  Date = "date",
  Currency = "currency",
}
