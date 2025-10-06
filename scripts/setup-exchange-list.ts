import * as fs from 'fs';
import * as ccxt from 'ccxt';
import { config } from 'dotenv';
import { EXCHANGE_LIST } from '../shared/const/exchanges';

config();

function setupExchangeList() {
  if (fs.existsSync(process.env.EXCHANGE_LIST_FILE_PATH)) return;

  // @ts-ignore
  const exchanges: string[] = ccxt.pro.exchanges.filter(
    (exchangeName: string) => !EXCHANGE_LIST.find(({ code }) => exchangeName === code),
  );

  fs.writeFileSync(process.env.EXCHANGE_LIST_FILE_PATH, exchanges.join('\n'));
}

setupExchangeList();
