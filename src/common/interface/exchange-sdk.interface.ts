import { Exchange } from 'ccxt';
import { SystemParamsInterface } from '../../environment/script/scenario/script-scenario.service';

export type ExchangeKeysType = { apiKey: string; secret: string; password?: string; uid?: string; sandboxMode?: boolean };

export interface ExchangeSDKInterface {
  getSDK(exchange: string, keys: ExchangeKeysType);

  enableHedgeMode(): void;

  getCurrentTime(): number;

  setSource(dir: string, key: string, startDate: Date, endDate: Date): void;

  getConfig(): SystemParamsInterface;
}
