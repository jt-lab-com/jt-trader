import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { pro as ccxt } from 'ccxt';
import { CacheService } from '../../common/cache/cache.service';
import { DataFeedFactory } from '../../environment/data-feed/data-feed.factory';
import { MarketType } from '@packages/types';

type DataType = 'ticker' | 'orders-book';

const SUBSCRIBE_QUOTES = 'SUBSCRIBE_QUOTES';

@Injectable()
export class DataSourceService {
  private sources: object = {};
  private listeners: object = {};
  private isStarted = false;

  constructor(
    @InjectPinoLogger(DataSourceService.name) private readonly logger: PinoLogger,
    private readonly cacheService: CacheService,
    private readonly dataFeedFactory: DataFeedFactory,
  ) {
    cacheService.subscribe(SUBSCRIBE_QUOTES, (key: string) => {
      logger.info({ key }, 'DataSource subscribe call');
      if (typeof key !== 'string' || !!this.sources[key]) return;

      const values = key.split('::');
      if (
        !values ||
        values.length < 4 ||
        !ccxt[values[0].toLowerCase().replace('-testnet', '')] ||
        ['ticker', 'orders-book'].indexOf(values[2].toLowerCase()) === -1
      ) {
        logger.error({ key }, 'Invalid DataSource');
        return;
      }

      this.addSource(
        values[0].toLowerCase(),
        values[1].toLowerCase() as MarketType,
        values[2].toLowerCase() as DataType,
        values[3],
      );
    });
  }

  private addSource = (exchange: string, marketType: MarketType, type: DataType, asset: string) => {
    const key = `${exchange.toUpperCase()}::${marketType}::${type.toUpperCase()}::${asset.toUpperCase()}`;
    switch (type) {
      case 'ticker': {
        this.sources[key] = this.dataFeedFactory.subscribeTickerNative(exchange, marketType, asset, async (data) => {
          this.listeners[key] = await this.cacheService.publish(key, data, true);
        });
        break;
      }
      case 'orders-book': {
        this.sources[key] = this.dataFeedFactory.subscribeOrdersBookNative(
          exchange,
          marketType,
          asset,
          async (data) => {
            this.listeners[key] = await this.cacheService.publish(key, data, true);
          },
        );
        break;
      }
      default: {
        this.logger.error({ type }, 'DataSource add invalid type');
        break;
      }
    }

    if (!this.isStarted) {
      this.isStarted = true;
      this.monitoring();
    }
  };

  private removeSource = (key: string) => {
    const values = key.split('::');

    switch (values[2].toLowerCase()) {
      case 'ticker': {
        this.dataFeedFactory.unsubscribeTickerNative(
          values[0].toLowerCase(),
          values[1].toLowerCase() as MarketType,
          values[2],
          this.sources[key],
        );
        break;
      }
      case 'orders-book': {
        this.dataFeedFactory.unsubscribeOrdersBookNative(
          values[0].toLowerCase(),
          values[1].toLowerCase() as MarketType,
          values[2],
          this.sources[key],
        );
        break;
      }
      default: {
        this.logger.error({ type: values[1].toLowerCase() }, 'DataSource remove invalid type');
        break;
      }
    }
  };

  private monitoring() {
    const sources = Object.entries(this.listeners);
    sources.filter(([key, listeners]) => {
      if (listeners > 0) return true;
      this.removeSource(key);
      return false;
    });

    this.logger.info({ sources }, 'DataSources clients monitoring');
    setTimeout(() => {
      this.monitoring();
    }, 60000);
  }
}
