import * as fs from 'fs';
import { config } from 'dotenv';
import * as ccxt from 'ccxt';
import * as path from 'path';
import { EXCHANGE_LIST } from '../shared/const/exchanges';

const EXCHANGE_CODES = EXCHANGE_LIST.map((exchange) => exchange.code);

config();

function ensureMarketsDir() {
  if (!fs.existsSync(process.env.MARKETS_DIR_PATH)) {
    fs.mkdirSync(process.env.MARKETS_DIR_PATH);
  }
}

async function downloadMarkets() {
  ensureMarketsDir();

  for (const code of EXCHANGE_CODES) {
    if (code.includes('-testnet') || code.includes('-mock')) continue;
    const filePath = path.join(process.env.MARKETS_DIR_PATH, `${code}.json`);
    if (fs.existsSync(filePath)) continue;

    const exchange = new ccxt[code]({
      enableRateLimit: true,
      options: {
        defaultType: 'future',
      },
    });
    const markets = await exchange.fetchMarkets();

    fs.writeFileSync(filePath, JSON.stringify(markets));
  }
}

downloadMarkets()
  .then(() => {
    console.log(`Markets files successfully downloaded to: ${process.env.MARKETS_DIR_PATH}`);
  })
  .catch((err) => console.error(err));
