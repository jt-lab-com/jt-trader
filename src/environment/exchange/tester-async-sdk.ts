import { ORDER_UPDATE_EVENT, TesterSyncSDK, TICK_END_EVENT, TICK_EVENT } from './tester-sync-sdk';
import { HistoryBarsService } from '../history-bars/history-bars.service';
import { AsyncEventEmitter } from '../../common/async-event-emitter';
import { OrderServiceInterface } from './interface/order-service.interface';

export class TesterAsyncSDK extends TesterSyncSDK {
  constructor(
    protected readonly getRow: () => Promise<any>,
    protected readonly orderService: OrderServiceInterface,
    protected readonly historyBarsService: HistoryBarsService,
  ) {
    super(getRow, orderService, historyBarsService);
    this.events = new AsyncEventEmitter();
  }

  protected processUpdates = async () => {
    let isProcessed = false;

    const updates = this.orderService.checkOrdersUpdates();
    if (updates) {
      isProcessed = true;
      for (const data of updates) {
        await this.events.emit(ORDER_UPDATE_EVENT, [data]);
      }
    }
    return isProcessed;
  };

  iterator = 0;
  lstTms = 0;

  protected runTicker = (symbol: string) => {
    this.getRow().then(async (data) => {
      this.iterator++;
      if (this.iterator % 10000 === 0) {
        console.log(
          'Tick END ' + this.iterator + ' - ' + data.timestamp + ` - ${((Date.now() - this.lstTms) / 1000).toFixed(2)}`,
        );
        this.lstTms = Date.now();
      }

      // if (!data) {
      //   return;
      // } else {
      this.setCurrentRow(data);
      this.orderService.setNewCandle(data);
      this.orderService.trigger(symbol);

      await this.processUpdates();
      await this.events.emit(TICK_EVENT, data);
      await this.processUpdates();
      await this.events.emit(TICK_END_EVENT, data);

      setImmediate(() => {
        this.runTicker(symbol);
      });
      // }
    });

    // минута 18 -> onTick - создаём лимитку и создаём маркет
    // минута 18 -> onOrderChange(tms() = 18) - исполнили маркет,
    // минута 18 -> runTickEnded(tms() = 18)
    // минута 19 -> onOrderChange(tms() = 19) - исполнили лимитку,
    // минута 19 -> onTick...,

    // .catch(console.error);
  };

  // emitTicker = (symbol: string) => (data: Ticker) => {
  //   this.setCurrentRow(data);
  //   this.orderService.trigger(symbol, data);
  // };

  // @ts-ignore
  protected fetchOHLCV = async (symbol: string, timeframe: string, since: number, limit?: number): Promise<any[][]> => {
    const convertedTimeframe = timeframe.indexOf('m') > -1 ? parseInt(timeframe) : parseInt(timeframe) * 60;

    const data = await this.historyBarsService.getBarsAsync({
      symbol,
      timeframe: convertedTimeframe,
      start: new Date(since),
      limit,
    });

    return data.map(({ time, open, high, low, close }) => [time, open, high, low, close]);
  };

  private _promisifyParent(method: string, ...args): Promise<any> {
    return Promise.resolve(super[method](...args));
  }

  // @ts-ignore
  createOrder = (...args): Promise<any> => {
    return this._promisifyParent('createOrder', ...args);
  };

  // @ts-ignore
  editOrder = (...args): Promise<any> => {
    return this._promisifyParent('editOrder', ...args);
  };

  // @ts-ignore
  cancelOrder = (...args): Promise<any> => {
    return this._promisifyParent('cancelOrder', ...args);
  };

  // @ts-ignore
  fetchBalance = (...args): Promise<any> => {
    return this._promisifyParent('fetchBalance', ...args);
  };

  // @ts-ignore
  fetchPositions = (...args): Promise<any> => {
    return this._promisifyParent('fetchPositions', ...args);
  };

  // @ts-ignore
  fetchOrders = (...args): Promise<any> => {
    return this._promisifyParent('fetchOrders', ...args);
  };

  // @ts-ignore
  fetchOpenOrders = (...args): Promise<any> => {
    return this._promisifyParent('fetchOpenOrders', ...args);
  };

  // @ts-ignore
  fetchClosedOrders = (...args): Promise<any> => {
    return this._promisifyParent('fetchClosedOrders', ...args);
  };

  setLeverage = (...args): Promise<any> => {
    return this._promisifyParent('setLeverage', ...args);
  };
}
