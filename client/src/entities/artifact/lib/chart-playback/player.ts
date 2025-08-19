import { CandleStick } from "@packages/types";
import { delay } from "@/shared/lib/delay";
import { chartEvents, Events } from "./events";

interface ChartPlayerConstructorParams {
  candles: CandleStick[];
  defaultSpeed: ChartPlayerSpeed;
  onTick: (candle: CandleStick) => void;
}

export enum ChartPlayerSpeed {
  x1 = "x1",
  x2 = "x2",
  x4 = "x4",
}

export class ChartPlayer {
  private candles: CandleStick[];
  private lastCandle: CandleStick | null = null;
  private isPause = false;
  private x1Speed = 20;
  private x2Speed = 10;
  private x4Speed = 5;
  private defaultSpeed = this.x4Speed;
  private currentSpeed = this.defaultSpeed;

  private readonly onTick: (candle: CandleStick) => void;

  constructor({ candles, defaultSpeed, onTick }: ChartPlayerConstructorParams) {
    this.candles = candles;
    this.changeSpeed(defaultSpeed);
    this.onTick = onTick;
  }

  public async play() {
    if (this.isPause) {
      this.isPause = false;
    }

    for (const candle of this.candles) {
      this.lastCandle = candle;

      const { open, close, low, high, time } = candle;
      const volume = parseFloat(`${candle.volume}`);

      const realtimeCandle = {
        open,
        low: open,
        high: open,
        close: open,
        time,
        volume: 0,
      };

      const startDirection =
        Math.abs(candle.open - candle.low) < Math.abs(candle.open - candle.high) ? "low" : "high";
      let direction = startDirection;

      const countTicks = 15;

      const tickStep = (high - low) / countTicks;
      const volumeTick = volume / countTicks;

      let isEnd = false;
      let isHighEnd = false;
      let isLowEnd = false;

      while (!isEnd) {
        if (this.isPause) return;

        if (direction === "low") {
          if (realtimeCandle.close - tickStep > low && !isLowEnd) {
            realtimeCandle.close -= tickStep;
          } else {
            realtimeCandle.low = low;
            isLowEnd = true;
            if (startDirection === "low") {
              direction = "high";
            } else {
              if (realtimeCandle.close + tickStep < close) {
                realtimeCandle.close += tickStep;
              } else {
                realtimeCandle.close = close;
                realtimeCandle.high = high;

                while (realtimeCandle.close - tickStep > close) {
                  realtimeCandle.close -= tickStep;

                  realtimeCandle.volume += volumeTick;
                  this.onTick(realtimeCandle);
                  await delay(this.currentSpeed);
                }

                realtimeCandle.close = close;

                realtimeCandle.volume += volumeTick;
                this.onTick(realtimeCandle);
                await delay(this.currentSpeed);
                isEnd = true;
              }
            }
          }
        } else {
          if (realtimeCandle.close + tickStep < high && !isHighEnd) {
            realtimeCandle.close += tickStep;
          } else {
            realtimeCandle.high = high;
            isHighEnd = true;
            if (startDirection === "high") {
              direction = "low";
            } else {
              if (realtimeCandle.close - tickStep > close) {
                realtimeCandle.close -= tickStep;
              } else {
                realtimeCandle.close = close;
                realtimeCandle.low = low;

                while (realtimeCandle.close + tickStep < close) {
                  realtimeCandle.close += tickStep;

                  realtimeCandle.volume += volumeTick;
                  this.onTick(realtimeCandle);
                  await delay(this.currentSpeed);
                }

                realtimeCandle.close = close;

                realtimeCandle.volume += volumeTick;
                this.onTick(realtimeCandle);
                await delay(this.currentSpeed);
                isEnd = true;
              }
            }
          }
        }

        if (!isEnd) {
          realtimeCandle.volume += volumeTick;
          this.onTick(realtimeCandle);
          await delay(this.currentSpeed);
        }
      }
    }

    chartEvents.emit(Events.End);
    this.pause();
  }

  public pause() {
    try {
      this.isPause = true;
      const lastCandleIndex = this.candles.findIndex((candle) => candle.time === this.lastCandle?.time);
      this.candles = this.candles.slice(lastCandleIndex);
    } catch (e) {
      console.error(e);
    }
  }

  public pushHistoryBars(bars: CandleStick[]) {
    this.candles = this.candles.concat(bars);
  }

  public changeSpeed(speed: string) {
    switch (speed) {
      case "default":
        this.currentSpeed = this.defaultSpeed;
        break;
      case "x1":
        this.currentSpeed = this.x1Speed;
        break;
      case "x2":
        this.currentSpeed = this.x2Speed;
        break;
      case "x4":
        this.currentSpeed = this.x4Speed;
        break;
      default:
        this.currentSpeed = this.defaultSpeed;
    }
  }
}
