import { HistoryBarsSource } from '../types';
import axios, { AxiosInstance } from 'axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BinanceSource implements HistoryBarsSource {
  private readonly api: AxiosInstance;
  sourceName = 'binance';

  constructor() {
    this.api = axios.create({
      baseURL: 'https://data.binance.vision/data/futures/um/monthly/klines',
    });
  }

  async download(symbol: string, timeframe: string, date: Date): Promise<Buffer> {
    const formattedSymbol = symbol.replace('/', '').toUpperCase();
    const filename = `${formattedSymbol}-${timeframe}-${date.toISOString().slice(0, 7)}.zip`;
    const url = `${formattedSymbol}/${timeframe}/${filename}`;

    const { data } = await this.api.get(url, { responseType: 'arraybuffer' });

    return data;
  }
}
