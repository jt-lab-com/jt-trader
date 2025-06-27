import { PlaybackChartSymbolData } from "./chart-playback";

export interface Artifact {
  id: string;
  symbol: string;
  title?: string;
  description?: string;
  blocks: ArtifactBlock[];
}

export interface ArtifactBlock {
  type: ArtifactBlockType;
  name?: string;
  isVisible: boolean;
  data: // | TVChartData
  | TableData[]
    | DrawdownChartData
    | ChartData
    | CardData
    | CardData[]
    | ActionButtonData
    | ActionButtonData[]
    | TextBlockData
    | ChartPlaybackData;
}

export enum ArtifactBlockType {
  TRADING_VIEW_CHART = "trading_view_chart",
  DRAWDOWN_CHART = "drawdown_chart",
  TABLE = "table",
  CHART = "chart",
  CARD = "card",
  CARD_LIST = "card_list",
  ACTION_BUTTON = "action_button",
  ACTION_BUTTON_LIST = "action_button_list",
  TEXT = "text",
  CHART_PLAYBACK = "chart_playback",
}

export interface TextBlockData {
  value: string;
  variant: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "body1";
  align?: "left" | "center" | "right";
}

export interface ChartData {
  series: Series[];
  time: string[];
  colors?: string[];
  type?: ChartType;
}

export enum ChartType {
  Area = "area",
  Line = "line",
}

interface Series {
  name: string;
  color?: string;
  data: number[];
}

export interface DrawdownChartData {
  profit: number[];
  drawdown: number[];
  positions_count: number[];
  t: string[];
}

export interface CardData {
  title: string;
  value: string | number;
  variant: ReportCardVariant;
  options?: {
    format?: ReportCardNumberFormat;
    currency?: string;
    icon?: ReportCardIcon;
    caption?: string;
  };
}

export enum ReportCardVariant {
  Text = "text",
  Number = "number",
  Percent = "percent",
}

export enum ReportCardNumberFormat {
  Default = "default",
  Short = "short",
  Date = "date",
  Currency = "currency",
}

export enum ReportCardIcon {
  ChartUp = "chart-up",
  ChartDown = "chart-down",
}

export interface ActionButtonData {
  label: string;
  action: string;
  payload: string | number | object;
}

export type TableData = Record<string, unknown>;

export interface ChartPlaybackData {
  symbols: PlaybackChartSymbolData[];
}

// export interface TVChartData {
//   exchange: string;
//   interval: number;
//   startTime: number;
//   endTime: number;
//   table: Array<TVTableShapeItem>;
//   shapes: TVUserShape[];
//   multipointShapes: TVUserMultipointShape[];
//   indicator?: CustomIndicator;
//   oscillator?: CustomOscillator;
// }

export interface CustomIndicator {
  name?: string;
  timeframe: number;
  data: CustomIndicatorData[];
}

export interface CustomIndicatorData {
  timestamp: number;
  value: number;
}

export interface CustomOscillator {
  name?: string;
  timeframe: number;
  data: CustomOscillatorData[];
}

export interface CustomOscillatorData {
  timestamp: number;
  value: number;
}

export interface TVTableShapeItem {
  id: number;
  [key: string]: string | number;
}
