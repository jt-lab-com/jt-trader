import axios, { AxiosInstance } from 'axios';
import * as zlib from 'zlib';
import { promisify } from 'util';
import { Injectable } from '@nestjs/common';
import * as Papa from 'papaparse';
import * as archiver from 'archiver';
import { PassThrough } from 'node:stream';
import { HistoryBarsSource } from '../types';

const unzip = promisify(zlib.unzip);

@Injectable()
export class GateIoSource implements HistoryBarsSource {
  private readonly api: AxiosInstance;
  sourceName = 'gate.io';

  constructor() {
    this.api = axios.create({
      baseURL: 'https://download.gatedata.org/futures_usdt',
    });
  }

  async download(symbol: string, timeframe: string, date: Date): Promise<Buffer> {
    const formattedSymbol = symbol.replace('/', '_').toUpperCase();
    const month = date.toISOString().slice(0, 7).replace('-', '');
    const url = `/candlesticks_${timeframe}/${month}/${formattedSymbol}-${month}.csv.gz`;

    const { data } = await this.api.get(url, { responseType: 'arraybuffer' });

    const rawData = await unzip(data);
    const filename = `${formattedSymbol.replace('_', '')}-${timeframe}-${date.toISOString().slice(0, 7)}.csv`;

    return this.normalizeData(rawData, filename);
  }

  private normalizeData(data: Buffer, filename: string): Promise<Buffer> {
    return new Promise(async (res, rej) => {
      const formatted = await new Promise<Buffer>((res) => {
        Papa.parse(data.toString('utf-8'), {
          header: false,
          complete: (results: Papa.ParseResult<string>) => {
            const formatted = results.data.map((row) => {
              const timestamp = +row[0] * 1000;
              const open = row[5];
              const high = row[3];
              const low = row[4];
              const close = row[2];
              const volume = row[1];
              const closeTime = timestamp + 59999;

              return [timestamp, open, high, low, close, volume, closeTime];
            });
            const csv = Papa.unparse(formatted);
            res(Buffer.from(csv));
          },
        });
      });

      const archive = archiver('zip');
      const bufferStream = new PassThrough();
      const chunks = [];

      bufferStream.on('data', (chunk) => chunks.push(chunk));
      bufferStream.on('end', () => res(Buffer.concat(chunks)));
      bufferStream.on('error', rej);

      archive.on('error', rej);
      archive.pipe(bufferStream);

      archive.append(formatted, { name: filename });
      archive.finalize().catch(rej);
    });
  }
}
