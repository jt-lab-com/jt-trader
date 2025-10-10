import { Exchange } from 'ccxt';
import * as ccxt from 'ccxt';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { TesterAsyncSDK } from './tester-async-sdk';
import { OrderService } from './order.service';
import { HistoryBarsService } from '../history-bars/history-bars.service';
import { MultiCartOrderService } from './multi-cart-order.service';

export class ExchangeSdkFactory {
  constructor(
    @InjectPinoLogger(ExchangeSdkFactory.name) private readonly logger: PinoLogger,
    protected readonly orderService: OrderService,
    protected readonly historyBarsService: HistoryBarsService,
  ) {}

  build(
    exchangeName: string,
    isMock: boolean,
    ...args
  ): Exchange & { getMockOrderService: () => MultiCartOrderService } {
    const logger = this.logger;
    const orderService = new MultiCartOrderService(this.logger);
    const mockedSDK = new TesterAsyncSDK(() => Promise.resolve({}), orderService, this.historyBarsService);

    class ExtendedExchange extends ccxt.pro[exchangeName] {
      private _lastWebSocketCall: number;
      private _isFailed = false;
      private _retriesCounter = 0;
      private _callTicker = 0;
      private _lastError: Error = undefined;
      private _exchangeName = exchangeName;
      private _isMock: () => boolean = () => isMock;
      private _getMockedSDK: () => TesterAsyncSDK = () => mockedSDK;

      getMockOrderService() {
        return orderService;
      }

      /*
       * method: 'editOrder' | 'cancelOrder' fetchOpenOrders fetchClosedOrders fetchPositions fetchBalance setLeverage
       *
       * */
      async _superFetchMethodCall(method: string, ...args) {
        if (this._isMock()) {
          return await this._getMockedSDK()[method](...args);
        }

        return await super[method](...args);
      }

      createOrder(...args) {
        return this._superFetchMethodCall('createOrder', ...args);
      }

      editOrder(...args) {
        return this._superFetchMethodCall('editOrder', ...args);
      }

      cancelOrder(...args) {
        return this._superFetchMethodCall('cancelOrder', ...args);
      }

      fetchOrders(...args) {
        return this._superFetchMethodCall('fetchOrders', ...args);
      }

      fetchOpenOrders(...args) {
        return this._superFetchMethodCall('fetchOpenOrders', ...args);
      }

      fetchClosedOrders(...args) {
        return this._superFetchMethodCall('fetchClosedOrders', ...args);
      }

      fetchPositions(...args) {
        return this._superFetchMethodCall('fetchPositions', ...args);
      }

      fetchBalance(...args) {
        return this._superFetchMethodCall('fetchBalance', ...args);
      }

      setLeverage(...args) {
        return this._superFetchMethodCall('setLeverage', ...args);
      }

      async _superWsMethodCall(method: string, ...args) {
        const now = Date.now();
        if (this._isFailed && now - this._lastWebSocketCall < 1000) throw this._lastError;

        this._lastWebSocketCall = now;
        try {
          /* debug */
          // this._callTicker++;
          // if (this._callTicker >= 15 && this._callTicker <= 26) {
          //   throw new Error(`Error ${this._callTicker} tick!`);
          // }
          /* debug end */

          const res = await super[method](...args);
          this._isFailed = false;
          this._retriesCounter = 0;
          this._lastError = undefined;
          return res;
        } catch (e) {
          // logger.warn({ exchangeName, method }, `Retries counter: ${this._retriesCounter}`);
          this._isFailed = true;
          this._retriesCounter++;
          this._lastError = e;
          e.ctx = { method, args };
          throw e;
        }
      }

      _mockedWatch(callback?: () => unknown, timeout = 1000) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(callback?.());
          }, timeout);
        });
      }

      async watchTicker(symbol: string, ...args) {
        const res = await this._superWsMethodCall('watchTicker', symbol, ...args);
        if (!res.timestamp) {
          res.timestamp = Date.now();
        }
        orderService.setNewCandle(res);
        orderService.trigger(symbol);
        return res;
      }

      watchOrderBook(...args) {
        return this._superWsMethodCall('watchOrderBook', ...args);
      }

      watchOrders(...args) {
        if (this._isMock()) {
          return this._mockedWatch(() => orderService.checkOrdersUpdates());
        }

        return this._superWsMethodCall('watchOrders', ...args);
      }

      watchBalance(...args) {
        if (this._isMock()) {
          return this._mockedWatch(() => {
            const updates = orderService.checkBalanceUpdates();
            if (!updates) return;
            const { balance, marginBalance } = updates;
            const [free, used, total] = [
              balance,
              marginBalance !== 0 ? marginBalance - balance : 0,
              balance + (marginBalance !== 0 ? marginBalance - balance : 0),
            ].map((value) => +value.toFixed(2));
            const tms = Date.now();
            // const free = balance;
            // const used = marginBalance;
            // const total = balance + marginBalance;

            return {
              USDT: { free, used, total },
              free: { USDT: free },
              used: { USDT: used },
              total: { USDT: total },
              timestamp: tms,
              datetime: tms ? new Date(tms).toISOString() : '',
            };
          });
        }

        return this._superWsMethodCall('watchBalance', ...args);
      }

      watchPositions(...args) {
        if (this._isMock()) {
          return this._mockedWatch(() => orderService.checkPositionsUpdates());
        }

        return this._superWsMethodCall('watchPositions', ...args);
      }

      get exchangeName() {
        return this._exchangeName;
      }

      get lastWebSocketCall() {
        return this._lastWebSocketCall;
      }

      get isFailed() {
        return this._isFailed;
      }

      set isFailed(isFailed) {
        this._isFailed = isFailed;
      }

      get retriesCounter() {
        return this._retriesCounter;
      }

      get nextRetryTms() {
        if (!this._isFailed) return undefined;

        let [factor, delay] = [1, 10 * 1000];

        if (this._retriesCounter > 5) factor *= 3;
        if (this._retriesCounter > 10) factor *= 3;
        if (this._retriesCounter > 15) factor *= 2;
        if (this._retriesCounter > 20) factor *= 2;

        return this._lastWebSocketCall + delay * factor;
      }
    }

    // @ts-ignore
    return new ExtendedExchange(...args);
  }
}
