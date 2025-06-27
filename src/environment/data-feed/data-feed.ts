import { PinoLogger } from 'nestjs-pino';
import { ExceptionReasonType } from '../../exception/types';

const MAX_RETRIES = 25;

export class DataFeed<T> {
  private subscribers: Map<number, (data: T) => void>;
  private currentValue: T;
  private isStarted: boolean;
  private sequence: number;
  private _lastReceiveTms: number;
  private _isStopped: boolean;
  private _method: string;

  constructor(
    private readonly sdk: any, //(...args) => void | any,
    private readonly args: any[],
    private readonly logger: PinoLogger,
    private readonly type: 'subscriber' | 'awaiter',
  ) {
    this.subscribers = new Map<number, (data: T) => void>();
    this.isStarted = false;
    this.sequence = 0;
    this._isStopped = false;
    this._method = args[0];
    this._lastReceiveTms = 0;
  }

  public retry = () => {
    //   if (this.retriesCounter >= MAX_RETRIES) {
    //     const e: any = new Error(`Exchange connection retries exceeded: ${JSON.stringify(this.args.slice(0, 3))}`);
    //     e.cause = ExceptionReasonType.SDKError;
    //     throw e;
    //   }
    //
    this.logger.info({ method: this._method }, 'DataFeed retry called');
    this._isStopped = false;
    this.isFailed = false;

    this.run();
  };

  private run = () => {
    this.isStarted = true;

    switch (this.type) {
      case 'awaiter': {
        (async () => {
          while (true) {
            if (this._isStopped) break;
            if (this.isEmpty || this.isFailed) {
              this._isStopped = true;
              break;
            }
            try {
              const data: T = await this.sdk[this.args[0]](...this.args.slice(1));
              if (data) this.onData(data);
            } catch (e) {
              this.logger.error({
                cause: ExceptionReasonType.SDKError,
                exchange: this.sdk.exchangeName,
                stack: e.stack?.split("\n")
              }, e.toString());
              this._isStopped = true;
              // if (this.retriesCounter >= MAX_RETRIES) {
              //   throw e;
              // }
              break;
            }
          }
        })();
        break;
      }
      case 'subscriber': {
        this.sdk[this.args[0]](...this.args.slice(1), this.onData);
        break;
      }
    }
  };

  public subscribe(subscriber: (data: T) => void): number {
    const key = ++this.sequence;
    this.subscribers.set(key, subscriber);
    this.sequence++;
    if (!this.isStarted) {
      this.run();
    }
    return key;
  }

  public unsubscribe(key: number): void {
    this.subscribers.delete(key);
  }

  private onData = (data: T): void => {
    for (let [, subscriber] of this.subscribers.entries()) {
      subscriber(data);
    }
    this.currentValue = data;
    this._lastReceiveTms = Date.now();
  };

  get arguments() {
    return this.args;
  }

  get lastReceiveTms() {
    return this._lastReceiveTms;
  }

  get lastWebSocketCall() {
    return this.sdk.lastWebSocketCall;
  }

  get retriesCounter() {
    return this.sdk.retriesCounter;
  }

  get isFailed() {
    return this.sdk.isFailed;
  }

  set isFailed(isFailed) {
    this.sdk.isFailed = isFailed;
  }

  get isStopped() {
    return this._isStopped;
  }

  set isStopped(isStopped) {
    this._isStopped = isStopped;
  }

  get isEmpty() {
    return this.subscribers.size < 1;
  }

  get nextRetryTms() {
    return this.sdk.nextRetryTms;
  }

  get method() {
    return this._method;
  }

  get exchange() {
    return this.sdk.exchangeName;
  }

  get subscribersCnt() {
    return this.subscribers.size;
  }
}
