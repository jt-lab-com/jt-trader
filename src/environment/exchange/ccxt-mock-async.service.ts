import { Injectable } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderDTOInterface, OrderInterface } from './interface/order.interface';
import { ExchangeKeysType, ExchangeSDKInterface } from '../../common/interface/exchange-sdk.interface';
import { Exchange, Ticker, Order, OrderBook, Balances } from 'ccxt';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { CsvParser } from 'nest-csv-parser';
import axios from 'axios';
import * as process from 'process';
import { AsyncEventEmitter } from '../../common/async-event-emitter';
import { HistoryBarsService } from '../history-bars/history-bars.service';
import { ORDER_UPDATE_EVENT, TesterSyncSDK, TICK_END_EVENT, TICK_EVENT } from './tester-sync-sdk';
import { EventEmitterInterface } from '../../common/interface/event-emitter.interface';
import { CCXTMockSyncService } from './ccxt-mock-sync.service';
import { TesterAsyncSDK } from './tester-async-sdk';

class TickerDTO {
  open_time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  close_time: number;
  quote_volume: number;
  count: number;
  taker_buy_volume: number;
  taker_buy_quote_volume: number;
  ignore: number;
}

@Injectable()
export class CCXTMockAsyncService extends CCXTMockSyncService {
  constructor(
    @InjectPinoLogger(CCXTMockAsyncService.name) protected readonly logger: PinoLogger,
    protected readonly orderService: OrderService,
    protected readonly historyBarsService: HistoryBarsService,
  ) {
    super(logger, orderService, historyBarsService);
    this.sdk = new TesterAsyncSDK(
      async () => {
        let result = this.rows.shift();
        if (!result) {
          await this.updateRows();
          result = this.rows.shift();
        }

        result.timestamp = result.time;
        if (!result) throw this.testerDataEnd();
        return result;
      },
      this.orderService,
      this.historyBarsService,
    );
    this.rows = [];
  }

  loadingMs = 0;

  protected updateRows = async () => {
    const { value: config } = this.rowsConfig.next();
    if (!config) throw this.testerDataEnd();

    try {
      const startTms = Date.now();
      const data = await this.historyBarsService.getBarsAsync({
        symbol: config.symbol,
        timeframe: parseInt(config.timeframe),
        start: config.date,
      });
      this.loadingMs += Date.now() - startTms;
      // this.rows = data.historyBars;
      this.rows = data;
    } catch (e) {
      console.error(e);
      console.error({ config });
    }
  };

  public setSource = async (symbol: string, timeframe: string, startDate: Date, endDate: Date) => {
    this.rowsConfig = (function* () {
      const currentDate = new Date(startDate.getTime());
      while (currentDate <= endDate) {
        yield { symbol, timeframe, date: currentDate };
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    })();

    await this.updateRows();
  };
}
