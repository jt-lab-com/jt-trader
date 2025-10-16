import { Injectable } from '@nestjs/common';
import { MarketType } from '@packages/types';
import { BINANCE_USDM_HARDCODED_LEVERAGES } from '@packages/const/exchanges';
import { CacheService } from '../../common/cache/cache.service';
import * as ccxt from 'ccxt';

@Injectable()
export class MarketsService {
  constructor(private readonly cacheService: CacheService) {}

  public async getExchangeMarkets(name: string, marketType: MarketType): Promise<any[]> {
    name = name.replace('-mock', '').replace('-testnet', '');
    const key = `EXCHANGE_MARKETS_${name.toUpperCase()}_${marketType.toUpperCase()}`;

    const data = await this.cacheService.getPublic(key);
    if (!data) {
      const sdk: ccxt.Exchange = new ccxt[name]({
        enableRateLimit: true,
        options: {
          defaultType: marketType,
        },
      });
      await sdk.loadMarkets(true);
      const tickers = await sdk.fetchTickers();
      const markets = Object.values(sdk.markets);
      const values = [];

      for (let i = 0; i < markets.length; i++) {
        const market = markets[i];
        if (!market[marketType]) continue;
        if (marketType === 'swap' && !market.linear) continue;

        const mergedData = { ...market, ...tickers[market.symbol] };
        if (name === 'binanceusdm') {
          const leverage = { max: BINANCE_USDM_HARDCODED_LEVERAGES[market.symbol], min: 1 };
          mergedData['limits'] ? (mergedData['limits']['leverage'] = leverage) : (mergedData['limits'] = { leverage });
        }
        values.push(mergedData);
      }

      await this.cacheService.setPublic(key, JSON.stringify(values), 8 * 60 * 60);

      return values;
    } else {
      return JSON.parse(data);
    }
  }
}
