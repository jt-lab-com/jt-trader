import { Injectable } from '@nestjs/common';
import { ExchangeKeysType, ExchangeSDKInterface } from '../../common/interface/exchange-sdk.interface';
import { SystemParamsInterface } from '../script/scenario/script-scenario.service';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { ExchangeSdkFactory } from './ccxt-sdk.factory';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { CacheService } from '../../common/cache/cache.service';
import { BINANCE_USDM_HARDCODED_LEVERAGES } from './exchange-connector/const';
import { ExtendedExchange } from './interface/exchange.interface';

@Injectable()
export class CCXTService implements ExchangeSDKInterface {
  private sdk: Map<string, ExtendedExchange>;
  private agent: SocksProxyAgent;

  constructor(
    private readonly sdkFactory: ExchangeSdkFactory,
    private readonly cacheService: CacheService,
    @InjectPinoLogger(CCXTService.name) private readonly logger: PinoLogger,
  ) {
    this.sdk = new Map();
    if (!!process.env.CCXT_PROXY) {
      this.agent = new SocksProxyAgent(process.env.CCXT_PROXY);
    }
  }

  public getSDK(name: string, keys: ExchangeKeysType): ExtendedExchange {
    let formattedName = name.replace('-testnet', '');
    const isMock: boolean = formattedName.endsWith('-mock');
    if (isMock) {
      formattedName = formattedName.replace('-mock', '');
    }

    const key: string = [formattedName, keys.apiKey].join('::');
    let exchange: ExtendedExchange = this.sdk.get(key);
    if (!exchange) {
      exchange = this.sdkFactory.build(formattedName, isMock, {
        defaultType: 'swap',
        agent: this.agent,
        ...keys,
      });
      if (keys.sandboxMode === true) {
        exchange.setSandboxMode(true);
      }
      exchange.options['adjustForTimeDifference'] = true;
      exchange.options['defaultType'] = 'swap';
      exchange.options['marginMode'] = 'cross'; // or 'cross' or 'isolated'
      exchange.options['defaultMarginMode'] = 'cross'; // 'cross' or 'isolated'

      this.sdk.set(key, exchange);
    }
    return exchange as ExtendedExchange;
  }

  public async getExchangeMarkets(name: string): Promise<any[]> {
    const key = `EXCHANGE_MARKETS_${name}`;

    const data = await this.cacheService.get(key);
    if (!data) {
      const sdk = this.getSDK(name, { apiKey: '', secret: '' });
      await sdk.loadMarkets(false);
      const tickers = await sdk.fetchTickers();
      const markets = Object.values(sdk.markets);
      const values = [];
      for (let i = 0; i < markets.length; i++) {
        const market = markets[i];
        if (market.swap !== true || market.linear !== true) continue;

        const mergedData = { ...market, ...tickers[market.symbol] };
        if (name === 'binanceusdm') {
          const leverage = { max: BINANCE_USDM_HARDCODED_LEVERAGES[market.symbol], min: undefined };
          mergedData['limits'] ? (mergedData['limits']['leverage'] = leverage) : (mergedData['limits'] = { leverage });
        }
        values.push(mergedData);
      }

      await this.cacheService.set(key, JSON.stringify(values), 60 * 60);

      return values;
    } else {
      return JSON.parse(data);
    }
  }

  async setSource(dir: string, key: string, startDate: Date, endDate: Date) {
    return;
  }

  public getCurrentTime = () => {
    return Date.now();
  };

  enableHedgeMode(): void {
    return;
  }

  public getConfig(): SystemParamsInterface {
    return {};
  }
}
