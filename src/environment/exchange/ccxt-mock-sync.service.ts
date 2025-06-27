import { Injectable } from '@nestjs/common';
import { OrderService } from './order.service';
import { ExchangeKeysType, ExchangeSDKInterface } from '../../common/interface/exchange-sdk.interface';
import { TesterSyncSDK } from './tester-sync-sdk';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { HistoryBarsService } from '../history-bars/history-bars.service';
import { ExceptionReasonType } from '../../exception/types';
import { SystemParamsInterface } from '../script/scenario/script-scenario.service';

const csvHeaders = [
  'open_time',
  'open',
  'high',
  'low',
  'close',
  'volume',
  'close_time',
  'quote_volume',
  'count',
  'taker_buy_volume',
  'taker_buy_quote_volume',
  'ignore',
];

@Injectable()
export class CCXTMockSyncService implements ExchangeSDKInterface {
  protected rows;
  protected rowsConfig: Generator<{ symbol: string; timeframe: string; date: Date }, void>;
  protected sdk;

  constructor(
    @InjectPinoLogger(CCXTMockSyncService.name) protected readonly logger: PinoLogger,
    protected readonly orderService: OrderService,
    protected readonly historyBarsService: HistoryBarsService,
  ) {
    let i = 0;
    this.sdk = new TesterSyncSDK(
      () => {
        let data = this.rows[i];
        if (!data) {
          this.updateRows();
          i = 0;
          data = this.rows[i];
        }
        if (!data) throw this.testerDataEnd();

        i++;
        return data;
      },
      orderService,
      historyBarsService,
    );
  }

  protected testerDataEnd() {
    const error: Error & { cause?: string } = new Error('🚫 Tester data end!');
    error.cause = ExceptionReasonType.TesterDataEnd;
    return error;
  }

  protected updateRows = () => {
    const { value: config } = this.rowsConfig.next();
    if (!config) throw this.testerDataEnd();

    try {
      this.rows = this.historyBarsService.getBarsFromDiskSync(config.symbol, config.timeframe, config.date);
    } catch (e) {
      console.error(e);
      console.error({ config });
    }
  };

  protected initRowsConfig = (symbol: string, timeframe: string, startDate: Date, endDate: Date): void => {
    this.rowsConfig = (function* () {
      const currentDate = new Date(startDate.getTime());
      while (currentDate <= endDate) {
        yield { symbol, timeframe, date: currentDate };
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    })();
  };

  public setSource = (symbol: string, timeframe: string, startDate: Date, endDate: Date): void => {
    this.initRowsConfig(symbol, timeframe, startDate, endDate);
    this.updateRows();
  };

  public getSDK = (name: string, keys: ExchangeKeysType) => {
    return this.sdk;
  };

  public getCurrentTime = () => {
    return this.orderService.getCurrentTime();
  };

  public enableHedgeMode = (): void => {
    return this.orderService.enableHedgeMode();
  };

  public getConfig(): SystemParamsInterface {
    return this.orderService.getConfig();
  }
}
