export interface Exchange {
  name: string;
  code: string;
  disabled: boolean;
  sandbox: boolean;
  connected?: boolean;
  fields: ExchangeField[];
}

export interface ExchangeField {
  name: string;
  label: string;
  type: 'string' | 'boolean';
  value?: string | boolean;
}

export type MarketType = 'swap' | 'spot';
