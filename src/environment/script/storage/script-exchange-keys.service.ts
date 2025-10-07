import { Injectable } from '@nestjs/common';
import { ExchangeKeysType } from '../../../common/interface/exchange-sdk.interface';
import { ExchangeConnectorService } from '../../exchange/exchange-connector/exchange-connector.service';
@Injectable()
export class ScriptExchangeKeysService {
  constructor(private readonly exchangeConnector: ExchangeConnectorService) {}

  async selectKeys(exchange: string, accountId: string): Promise<ExchangeKeysType> {
    return this.exchangeConnector.getExchangeConfig(accountId, exchange);
  }
}
