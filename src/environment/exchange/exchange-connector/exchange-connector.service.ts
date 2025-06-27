import { Injectable } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import { EXCHANGE_LIST } from './const';
import { Exchange, ExchangeField, SaveExchangeConfigParams } from '@packages/types';
import { ExchangeKeysType } from '../../../common/interface/exchange-sdk.interface';
@Injectable()
export class ExchangeConnectorService {
  constructor(private readonly configService: ConfigService) {}

  async getExchangeList(accountId: string): Promise<Array<Exchange & { connected: boolean }>> {
    const configParams = await this.configService.getParamsList(accountId);

    const getFieldValue = (field: ExchangeField) => {
      let value: string | boolean = configParams.find(({ name }) => name === field.name)?.value ?? '';

      if (value && field.type === 'string') {
        value = `${value.slice(0, 3)}${new Array(5).fill('•').join('')}${value.slice(-3)}`;
      }

      if (field.type === 'boolean') {
        value = value === 'true';
      }

      return value;
    };

    return EXCHANGE_LIST.map((exchange) => {
      const connected = exchange.fields.every((field) => {
        if (field.type !== 'string') return true;
        return !!configParams.find(({ name, value }) => name === field.name && !!value);
      });

      return {
        ...exchange,
        connected,
        fields: exchange.fields.map((field) => {
          return {
            ...field,
            value: getFieldValue(field),
          };
        }),
      };
    });
  }

  async updateExchangeConfig(accountId: string, fields: SaveExchangeConfigParams) {
    await this.configService.updateParamsList(accountId, fields);
  }

  async getExchangeConfig(accountId: string, code: string): Promise<ExchangeKeysType> {
    const exchange = EXCHANGE_LIST.find((exchange) => exchange.code === code);

    if (!exchange) return null;

    let apiKey = '';
    let secret = '';
    let password = undefined;
    let userId = undefined;

    for (const field of exchange.fields) {
      const param = await this.configService.getParam(accountId, field.name);
      const label = field.label.toLowerCase();
      if (!param || !label) return null;
      if (label.includes('key')) {
        apiKey = param.value;
      }
      if (label.includes('secret')) {
        secret = param.value;
      }
      if (label.includes('password')) {
        password = param.value;
      }
      if (label.includes('user')) {
        userId = param.value;
      }
    }

    return {
      apiKey,
      secret,
      password,
      uid: userId,
      sandboxMode: exchange.sandbox,
    };
  }
}
