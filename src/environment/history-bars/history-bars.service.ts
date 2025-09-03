import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import * as decompress from 'decompress';
import { GetBarsParams, HistoryBarsSource } from './types';
import { S3Source } from './sources/s3';
import { BinanceSource } from './sources/binance';
import { GateIoSource } from './sources/gate-io';
import { ConfigService } from '@nestjs/config';

const intervalMap: Record<string, string> = {
  '1': '1m',
  '5': '5m',
  '15': '15m',
  '60': '1h',
  '240': '4h',
};

@Injectable()
export class HistoryBarsService {
  path: string;
  private readonly s3Source: S3Source;
  private readonly fallbackSources: HistoryBarsSource[];
  private readonly isStandalone: boolean;

  constructor(
    private readonly config: ConfigService,
    @InjectPinoLogger(HistoryBarsService.name) private readonly logger: PinoLogger,
  ) {
    this.path = process.env.HISTORY_BARS_PATH;
    this.s3Source = new S3Source();
    this.fallbackSources = [new BinanceSource(), new GateIoSource()];
    this.isStandalone = this.config.get('STANDALONE_APP') === '1';
  }

  getBarsFromDiskSync = (symbol: string, timeframe: string, month: Date): any[] => {
    const formattedSymbol = symbol.replace('/', '').toUpperCase();
    const formattedTimeframe = intervalMap[timeframe];
    const filePath: string = path.join(
      this.path,
      formattedSymbol,
      formattedTimeframe,
      `${formattedSymbol}-${formattedTimeframe}-${month.toISOString().slice(0, 7)}.csv`,
    );
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const content = fs.readFileSync(filePath).toString().split('\n');

    if (content[0].indexOf('open') > -1) {
      content.shift();
    }

    return content
      .map((data) => {
        const arr = data.split(',');
        return {
          time: parseInt(arr[0]),
          timestamp: parseInt(arr[0]),
          open: parseFloat(arr[1]),
          high: parseFloat(arr[2]),
          low: parseFloat(arr[3]),
          close: parseFloat(arr[4]),
          volume: parseFloat(arr[5]),
          closeTime: parseInt(arr[6]),
        };
      })
      .filter((bar) => Object.values(bar).every((value) => !!value));
  };

  private async checkAndDownloadCsv(symbol: string, timeframe: number, date: Date): Promise<void> {
    return new Promise(async (res, rej) => {
      const formattedSymbol = symbol.replace('/', '').toUpperCase();
      const interval = intervalMap[timeframe];
      const downloadFolderPath = path.join(this.path, formattedSymbol, interval);
      const filename = `${formattedSymbol}-${interval}-${date.toISOString().slice(0, 7)}`;

      if (fs.existsSync(path.join(downloadFolderPath, `${filename}.csv`))) return res();

      if (!fs.existsSync(this.path)) {
        fs.mkdirSync(this.path);
      }

      if (!fs.existsSync(path.join(this.path, formattedSymbol))) {
        fs.mkdirSync(path.join(this.path, formattedSymbol));
      }

      if (!fs.existsSync(downloadFolderPath)) {
        fs.mkdirSync(downloadFolderPath);
      }

      const filepath = path.join(downloadFolderPath, `${filename}.zip`);

      try {
        const data = await this.downloadZip(symbol, interval, date);
        if (!data) throw new Error(`${symbol} quotes not found`);

        try {
          await decompress(data, downloadFolderPath);
          this.logger.info(`${filename}.csv successfully downloaded`);
          res();
        } catch (e) {
          this.logger.error(
            { file: filepath, message: e.message, stack: e.stack?.split('\n'), symbol },
            'an error occurred when writing downloaded historical bars to disk',
          );
        }
      } catch (e) {
        this.logger.error(
          { message: e.message, stack: e.stack?.split('\n'), symbol },
          'an error occurred while downloading historical bars',
        );

        return rej(e);
      }
    });
  }

  async downloadZip(symbol: string, timeframe: string, date: Date): Promise<Buffer | null> {
    if (!this.isStandalone) {
      try {
        return await this.s3Source.download(symbol, timeframe, date);
      } catch (e) {
        this.logger.error(
          { message: e.message, stack: e.stack?.split('\n'), source: this.s3Source.sourceName, symbol },
          'an error occurred while downloading historical bars',
        );
      }
    }

    for (const source of this.fallbackSources) {
      try {
        const data = await source.download(symbol, timeframe, date);

        if (!this.isStandalone) {
          try {
            await this.s3Source.upload(symbol, timeframe, date, data);
          } catch (e) {
            this.logger.error(
              { message: e.message, stack: e.stack?.split('\n'), symbol },
              'an error occurred while uploading historical bars to s3',
            );
          }
        }

        return data;
      } catch (e) {
        this.logger.error(
          { message: e.message, stack: e.stack?.split('\n'), source: source.sourceName },
          'an error occurred while downloading historical bars',
        );
      }
    }

    return null;
  }

  async prepareTesterSource(params: GetBarsParams) {
    const { symbol, timeframe, start, end = start } = params;

    if (start.getTime() > end.getTime()) return;

    if (start.toISOString().slice(0, 7) === end.toISOString().slice(0, 7)) {
      await this.checkAndDownloadCsv(symbol, timeframe, start);
      return;
    }

    const date = new Date(start.getTime());
    date.setDate(1);

    try {
      while (date.toISOString().slice(0, 7) !== end.toISOString().slice(0, 7)) {
        await this.checkAndDownloadCsv(symbol, timeframe, date);
        date.setMonth(date.getMonth() + 1);
        if (date.toISOString().slice(0, 7) === end.toISOString().slice(0, 7)) {
          await this.checkAndDownloadCsv(symbol, timeframe, date);
          break;
        }
      }
    } catch (e) {
      e.args = { symbol, timeframe, date: date.toISOString().slice(0, 7) };
      throw e;
    }
  }

  getBarsSync(params: GetBarsParams) {
    const { symbol, timeframe, start, end = start, limit } = params;

    if (start.getTime() > end.getTime()) return [];

    const date = new Date(start.getTime());
    date.setDate(1);

    if (start.toISOString().slice(0, 7) === end.toISOString().slice(0, 7)) {
      let bars = this.getBarsFromDiskSync(symbol, timeframe.toString(), start);
      if (start.getTime() !== end.getTime()) {
        bars = bars.filter((bar) => bar.time >= start.getTime() && bar.time <= end.getTime());
      }

      if (limit) {
        return bars.slice(0, limit);
      }

      return bars;
    }

    let result = [];

    while (date.toISOString().slice(0, 7) !== end.toISOString().slice(0, 7)) {
      try {
        const bars = this.getBarsFromDiskSync(symbol, timeframe.toString(), date);
        result = [...result, ...bars];
        date.setMonth(date.getMonth() + 1);
        if (date.toISOString().slice(0, 7) === end.toISOString().slice(0, 7)) {
          result = [...result, ...this.getBarsFromDiskSync(symbol, timeframe.toString(), date)];
          break;
        }
      } catch (e) {
        break;
      }
    }

    const bars = result.filter((bar) => bar.time >= start.getTime() && bar.time <= end.getTime()) ?? [];

    if (limit) {
      return bars.slice(0, limit);
    }

    return bars;
  }

  async getBarsAsync(params: GetBarsParams) {
    try {
      await this.prepareTesterSource(params);
    } catch (e) {}
    return this.getBarsSync(params);
  }
}
