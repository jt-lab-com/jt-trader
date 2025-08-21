import { HistoryBarsService } from '../history-bars/history-bars.service';
import { Ticker } from 'ccxt';
import { EventEmitterInterface } from '../../common/interface/event-emitter.interface';
import { SyncEventEmitter } from '../../common/sync-event-emitter';
import { OrderServiceInterface } from './interface/order-service.interface';

export const TICK_EVENT = 'tick-event';
export const TICK_END_EVENT = 'tick-end-event';
export const ORDER_UPDATE_EVENT = 'order-update-event';

export class TesterSyncSDK {
  protected currentRow: Ticker;
  protected tickerStarted: boolean;
  protected events: EventEmitterInterface;

  constructor(
    protected readonly getRow: () => any,
    protected readonly orderService: OrderServiceInterface,
    protected readonly historyBarsService: HistoryBarsService,
  ) {
    this.tickerStarted = false;
    this.events = new SyncEventEmitter();
  }

  getCurrentRow(): Ticker {
    return this.currentRow;
  }

  setCurrentRow(data: Ticker): void {
    this.currentRow = { ...data };
  }

  getProfit() {
    return this.orderService.getProfit();
  }

  getFee() {
    return this.orderService.getBalanceFee();
  }

  protected processUpdates(): Promise<boolean> | boolean {
    let isProcessed = false;

    const updates = this.orderService.checkUpdates();
    if (updates) {
      isProcessed = true;
      for (const data of updates) {
        this.events.emit(ORDER_UPDATE_EVENT, [data]);
      }
    }
    return isProcessed;
  }

  iterator = 0;
  lstTms = 0;

  protected runTicker(symbol: string): void {
    this.iterator++;
    const data = this.getRow();

    if (this.iterator % 50000 === 0) {
      console.log(
        'Tick END ' + this.iterator + ' - ' + data.timestamp + ` - ${((Date.now() - this.lstTms) / 1000).toFixed(2)}`,
      );
      this.lstTms = Date.now();
    }

    // this.setCurrentRow(data);

    // this.processUpdates();
    this.orderService.setNewCandle(data);
    this.events.emit(TICK_EVENT, data); // limit
    this.orderService.trigger(symbol);

    for (let i = 0; i < 3; i++) {
      if (!this.processUpdates()) {
        break;
      }
      if (i > 2) {
        throw new Error('Loop in onOrderChange');
      }
    }
    //->end new date

    this.events.emit(TICK_END_EVENT, data); // createOrder 3

    if (this.iterator % 5000 === 0) {
      setImmediate(() => {
        this.runTicker(symbol);
      });
    } else {
      process.nextTick(() => {
        this.runTicker(symbol);
      });
    }
  }

  watchOrderBook() {
    const value = this.getCurrentRow()?.close;
    const tms = this.getCurrentRow()?.timestamp;
    return Promise.resolve({
      asks: [
        [value, 0, tms],
        [value, 0, tms],
      ],
      bids: [
        [value, 0, tms],
        [value, 0, tms],
      ],
      timestamp: tms,
      datetime: tms ? new Date(tms).toISOString() : '',
      nonce: 0,
    });
  }

  watchTicker(symbol: string, subscriber: (data: Ticker) => void) {
    this.events.on(TICK_EVENT, subscriber);
    if (!this.tickerStarted) {
      this.tickerStarted = true;
      //wait for await this.scriptProcessFactory.registerTest(id, { ...params, timeframe, symbol, startDate, endDate });
      setTimeout(() => {
        this.runTicker(symbol);
      }, 100);
    }
  }

  // only for tester implementation
  watchEndOfTick(subscriber: (data: Ticker) => void) {
    this.events.on(TICK_END_EVENT, subscriber);
  }

  watchOrders(symbol, subscriber: (data) => void) {
    this.events.on(ORDER_UPDATE_EVENT, subscriber);
  }

  createOrder(symbol, type, side, amount, price, params) {
    return this.orderService.create({ symbol, type, side, amount, price, ...params });
  }

  editOrder(orderId, symbol, type, side, amount, price, params) {
    const order = this.orderService.getOrder(orderId);
    if (order.status !== 'open') return;

    return this.orderService.update(orderId, { symbol, type, side, amount, price, ...params });
  }

  cancelOrder(orderId: string) {
    const order = this.orderService.getOrder(orderId);
    if (order.status !== 'open' && order.status !== 'untriggered') return;

    return this.orderService.update(orderId, { status: 'canceled' });
  }

  fetchBalance(): any {
    const tms = this.getCurrentRow()?.timestamp;
    // const unrealizedPnl = this.orderService.getPositions().reduce((acc, position) => acc + position.unrealizedPnl, 0);
    const { balance, marginBalance } = this.orderService.getBalance();
    const [free, used, total] = [balance, marginBalance, balance - marginBalance].map((value) =>
      value.toFixed(this.orderService.getPricePrecision()),
    );

    return {
      USDT: { free, used, total },
      free: { USDT: free },
      used: { USDT: used },
      total: { USDT: total },
      timestamp: tms,
      datetime: tms ? new Date(tms).toISOString() : '',
    };
  }

  fetchOHLCV(symbol, timeframe, since, limit): any[][] {
    const convertedTimeframe = timeframe.indexOf('m') > -1 ? parseInt(timeframe) : parseInt(timeframe) * 60;
    const data = this.historyBarsService.getBarsSync({
      symbol: symbol.replace('/', '').replace(':USDT', ''),
      timeframe: convertedTimeframe,
      start: new Date(since),
      limit,
    });
    return data.map(({ time, open, high, low, close }) => [time, open, high, low, close]);
  }

  fetchPositions(): any {
    return this.orderService.getPositions();
  }

  fetchOrders(): any {
    return this.orderService.getOrders();
  }

  fetchOpenOrders(): any {
    return this.orderService.getOpenedOrders();
  }

  fetchClosedOrders(): any {
    return this.orderService.getClosedOrders();
  }

  setLeverage(leverage: number, symbol: string): any {
    this.orderService.updateConfig({ defaultLeverage: leverage });
  }
}
