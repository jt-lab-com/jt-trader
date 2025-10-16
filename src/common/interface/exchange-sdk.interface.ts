import { SystemParamsInterface } from '../../environment/script/scenario/script-scenario.service';
import { MarketType } from '@packages/types';

export type ExchangeKeysType = {
  apiKey: string;
  secret: string;
  password?: string;
  uid?: string;
  sandboxMode?: boolean;
};

export interface ExchangeSDKInterface {
  getSDK(exchange: string, marketType: MarketType, keys: ExchangeKeysType);

  enableHedgeMode(): void;

  getCurrentTime(): number;

  setSource(dir: string, key: string, startDate: Date, endDate: Date): void;

  getConfig(): SystemParamsInterface;
}
