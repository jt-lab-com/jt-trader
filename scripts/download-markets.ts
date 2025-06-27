import * as fs from 'fs';
import { config } from 'dotenv';
import * as ccxt from 'ccxt';

config();

async function downloadMarkets() {
  const exchange = new ccxt.binanceusdm({
    enableRateLimit: true,
    options: {
      defaultType: 'future',
    },
  });
  const markets = await exchange.fetchMarkets();

  fs.writeFileSync(process.env.MARKETS_FILE_PATH, JSON.stringify(markets));
}

downloadMarkets().catch((err) => console.error(err));
