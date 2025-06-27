import { CandleStick, WS_CLIENT_EVENTS, WS_SERVER_EVENTS } from "@packages/types";
import axios, { AxiosInstance } from "axios";
import JSZip from "jszip";
import { nanoid } from "nanoid";
import { intervalMap } from "../const/interval-map";
import { emitSocketEvent, subscribe } from "./socket";

export class HistoryBarsLoader {
  private readonly axios: AxiosInstance;

  constructor(s3Host: string) {
    this.axios = axios.create({
      baseURL: s3Host,
    });
  }

  async getBars(
    symbol: string,
    timeframe: string,
    startTime: number,
    endTime: number,
    limit?: number
  ): Promise<CandleStick[]> {
    if (startTime > endTime) return [];
    const formattedSymbol = symbol.replace("/", "").toUpperCase();
    const interval = intervalMap[timeframe];
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    try {
      if (startDate.toISOString().slice(0, 7) === endDate.toISOString().slice(0, 7)) {
        const { error, data } = await this.downloadZip(formattedSymbol, interval, startDate);
        if (error || !data) return [];

        const bars = await this.unpack(data.data, data.filename);

        return bars ?? [];
      }

      const currentDate = new Date(startTime);
      currentDate.setDate(1);

      let result: CandleStick[] = [];

      while (currentDate.toISOString().slice(0, 7) !== endDate.toISOString().slice(0, 7)) {
        try {
          const { error, data } = await this.downloadZip(formattedSymbol, interval, currentDate);
          if (error || !data) return result;

          const bars = await this.unpack(data.data, data.filename);
          if (!bars) return result;

          result = [...result, ...bars];

          currentDate.setMonth(currentDate.getMonth() + 1);

          if (currentDate.toISOString().slice(0, 7) === endDate.toISOString().slice(0, 7)) {
            const { error, data } = await this.downloadZip(formattedSymbol, interval, currentDate);
            if (error || !data) return result;

            const bars = await this.unpack(data.data, data.filename);
            if (!bars) return result;

            result = [...result, ...bars];
            break;
          }
        } catch (e) {
          console.error(e);
          break;
        }
      }

      result = result.filter((bar) => bar.time >= startTime && bar.time <= endTime);

      if (limit) {
        result = result.slice(0, limit);
      }

      return result;
    } catch (e) {
      console.error(e);
    }

    return [];
  }

  private async downloadZip(symbol: string, timeframe: string, month: Date): Promise<DownloadZipResult> {
    const filename = `${symbol}-${timeframe}-${month.toISOString().slice(0, 7)}`;
    const s3Filepath = `/rates/${symbol}/${timeframe}/${filename}.zip`;

    let result: DownloadZipResultData | null = null;

    try {
      const response = await this.axios.get(s3Filepath, { responseType: "arraybuffer" });
      result = {
        filename: `${filename}.csv`,
        data: response.data,
      };
    } catch (e) {
      console.error(e);
    }

    if (!result) {
      try {
        const response = await this.downloadFromEngineServer(symbol, timeframe, month);
        if (response) {
          result = {
            filename: `${filename}.csv`,
            data: response,
          };
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (!result) {
      return {
        error: true,
        data: null,
      };
    }

    return {
      error: false,
      data: result,
    };
  }

  private downloadFromEngineServer(symbol: string, timeframe: string, date: Date): Promise<Blob | null> {
    const requestId = nanoid(8);

    return new Promise((res, rej) => {
      const unsub = subscribe(WS_SERVER_EVENTS.TESTER_HISTORICAL_BARS_RESPONSE, (payload) => {
        res(payload.data);
        unsub();
      });

      emitSocketEvent({
        event: WS_CLIENT_EVENTS.TESTER_HISTORICAL_BARS_REQUEST,
        payload: {
          requestId,
          symbol,
          timeframe,
          date,
        },
      });

      setTimeout(() => {
        rej("timeout");
      }, 20000);
    });
  }

  private async unpack(data: Blob, filename: string) {
    const zip = await JSZip.loadAsync(data);
    const csv = await zip.file(filename)?.async("string");

    return csv ? this.format(csv) : null;
  }

  private format(csv: string): CandleStick[] {
    const rows = csv.split("\n");

    if (rows[0].indexOf("open") > -1) {
      rows.shift();
    }

    return rows
      .map((data) => {
        const arr = data.split(",");
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
  }
}

export interface DownloadZipResult {
  error: boolean;
  data: DownloadZipResultData | null;
}

export interface DownloadZipResultData {
  filename: string;
  data: Blob;
}
