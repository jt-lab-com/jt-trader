import { Injectable } from '@nestjs/common';
import { ExchangeKeysType, ExchangeSDKInterface } from '../../common/interface/exchange-sdk.interface';
import { SystemParamsInterface } from '../script/scenario/script-scenario.service';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { ExchangeSdkFactory } from './ccxt-sdk.factory';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ExtendedExchange } from './interface/exchange.interface';
import { MarketType } from '@packages/types';

@Injectable()
export class CCXTService implements ExchangeSDKInterface {
  private sdk: Map<string, ExtendedExchange>;
  private agent: SocksProxyAgent;

  constructor(
    private readonly sdkFactory: ExchangeSdkFactory,
    @InjectPinoLogger(CCXTService.name) private readonly logger: PinoLogger,
  ) {
    this.sdk = new Map();
    if (!!process.env.CCXT_PROXY) {
      this.agent = new SocksProxyAgent(process.env.CCXT_PROXY);
    }
  }

  public getSDK(name: string, marketType: MarketType, keys?: ExchangeKeysType): ExtendedExchange {
    const isMock = name.endsWith('-mock');
    const formattedName = name.replace('-testnet', '').replace('-mock', '');

    const key: string = [formattedName, marketType, keys?.apiKey].join('::');
    let exchange: ExtendedExchange = this.sdk.get(key);

    // this.logger.info({ name, marketType, keys, key }, 'getSDK ------------>');
    if (!exchange) {
      exchange = this.sdkFactory.build(formattedName, isMock, {
        options: {
          defaultType: marketType,
        },
        defaultType: marketType,
        agent: this.agent,
        ...(!!keys?.apiKey && !!keys?.secret && { ...keys }),
      });
      if (keys?.sandboxMode === true) {
        exchange.setSandboxMode(true);
      }
      // exchange.options['adjustForTimeDifference'] = true;
      exchange.options['defaultType'] = marketType;
      // exchange.options['marginMode'] = 'cross'; // or 'cross' or 'isolated'
      // exchange.options['defaultMarginMode'] = 'cross'; // 'cross' or 'isolated'

      this.sdk.set(key, exchange);
    }
    return exchange as ExtendedExchange;
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
