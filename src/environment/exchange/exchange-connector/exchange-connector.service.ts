import { Injectable } from '@nestjs/common';
import { ConfigParamType, ConfigService } from '../../config/config.service';
import { EXCHANGE_LIST } from './const';
import { Exchange, ExchangeField, SaveExchangeConfigParams } from '@packages/types';
import { ExchangeKeysType } from '../../../common/interface/exchange-sdk.interface';
import * as ccxt from 'ccxt';

@Injectable()
export class ExchangeConnectorService {
  constructor(private readonly configService: ConfigService) {}

  async getExchangeList(accountId: string): Promise<{
    main: Array<Exchange & { connected: boolean }>;
    additional?: Array<Exchange & { connected: boolean }>;
  }> {
    const configParams = await this.configService.getParamsList(accountId);

    const mainExchangeList = EXCHANGE_LIST.map((exchange) => {
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
            value: this.getUserExchangeFieldValue(field, configParams),
          };
        }),
      };
    });

    const additionalExchanges = this.getAdditionalExchanges(configParams);
    const addedAdditionalExchanges = additionalExchanges.filter((exchange) => exchange.added);
    const availableAdditionalExchanges = additionalExchanges.filter((exchange) => !exchange.added);

    return {
      main: [...mainExchangeList, ...addedAdditionalExchanges],
      additional: availableAdditionalExchanges,
    };
  }

  private getAdditionalExchanges(
    configParams: ConfigParamType[],
  ): Array<Exchange & { connected: boolean; added: boolean }> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return ccxt.pro.exchanges
      .filter((exchangeName: string) => !EXCHANGE_LIST.find(({ code }) => exchangeName === code))
      .map((exchangeName: string): Exchange & { connected: boolean; added: boolean } => {
        const requiredCredentials = new ccxt.pro[exchangeName]().describe()?.requiredCredentials;
        const exchangeFields = Object.keys(requiredCredentials)
          .filter((key) => requiredCredentials[key])
          .map((key) => ({
            name: `${exchangeName}_${key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase()}`,
            label: key,
            type: 'string' as const,
            value: '',
          }));
        const connected = exchangeFields.every((field) => {
          if (field.type !== 'string') return true;
          return !!configParams.find(({ name, value }) => name === field.name && !!value);
        });
        const added = exchangeFields.every((field) => {
          if (field.type !== 'string') return true;
          return !!configParams.find(({ name }) => name === field.name);
        });

        return {
          code: exchangeName,
          name: exchangeName,
          added,
          connected,
          sandbox: false,
          disabled: false,
          fields: exchangeFields.map((field) => ({
            ...field,
            value: this.getUserExchangeFieldValue(field, configParams),
          })),
        };
      });
  }

  private getUserExchangeFieldValue(field: ExchangeField, configParams: ConfigParamType[]) {
    let value: string | boolean = configParams.find(({ name }) => name === field.name)?.value ?? '';

    if (value && field.type === 'string') {
      value = `${value.slice(0, 3)}${new Array(5).fill('•').join('')}${value.slice(-3)}`;
    }

    if (field.type === 'boolean') {
      value = value === 'true';
    }

    return value;
  }

  async updateExchangeConfig(accountId: string, fields: SaveExchangeConfigParams) {
    await this.configService.updateParamsList(accountId, fields);
  }

  async deleteExchangeFields(accountId: string, fields: string[]) {
    for (const fieldName of fields) {
      await this.configService.deleteParam(accountId, fieldName);
    }
  }

  async getExchangeConfig(accountId: string, code: string): Promise<ExchangeKeysType> {
    const exchange = EXCHANGE_LIST.find((exchange) => exchange.code === code);

    if (!exchange) {
      if (!ccxt.pro[code]) return null;
      const requiredCredentials = new ccxt.pro[code]()?.describe()?.requiredCredentials;
      const exchangeFields = Object.keys(requiredCredentials)
        .filter((key) => requiredCredentials[key])
        .map((key) => `${code}_${key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase()}`);

      const keys = {};

      for (const fieldName of exchangeFields) {
        const param = await this.configService.getParam(accountId, fieldName);
        const key = param.name.replace(`${code}_`, '').replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        keys[key] = param.value;
      }

      return keys as ExchangeKeysType;
    }

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
