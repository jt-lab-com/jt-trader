export interface GetBarsParams {
  symbol: string;
  timeframe: number;
  start: Date;
  end?: Date;
  limit?: number;
}

export abstract class HistoryBarsSource {
  sourceName: string;
  abstract download(symbol: string, timeframe: string, date: Date): Promise<Buffer>;
}
