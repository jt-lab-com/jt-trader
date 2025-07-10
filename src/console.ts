import { NestFactory } from '@nestjs/core';
import { AppModule } from './console.module';
import { ScriptTesterService } from './environment/script-tester/script-tester.service';
import { Logger } from 'nestjs-pino';
import { DataFeedFactory } from './environment/data-feed/data-feed.factory';
import { ScriptService } from './environment/script/script.service';
import { CacheService } from './common/cache/cache.service';
import * as process from 'process';
import { CCXTService } from './environment/exchange/ccxt.service';
import { OrderService } from './environment/exchange/order.service';
import { ScriptProcessFactory } from './environment/script/process/script-process.factory';
import { MainProcessExceptionHandler } from './exception/main-process-exception.handler';

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { bufferLogs: true });
  const logger = app.get(Logger);
  const scriptService = app.get(ScriptService);
  const cacheService = app.get(CacheService);
  const exchangeSdk = app.get(CCXTService).getSDK('', { apiKey: '', password: '', secret: '' });
  const processFactory = app.get(ScriptProcessFactory);
  const handler = app.get(MainProcessExceptionHandler);

  const argv = yargs(hideBin(process.argv)).argv;
  const {
    id,
    symbol,
    start,
    end,
    marketOrderSpread,
    defaultLeverage,
    takerFee,
    makerFee,
    balance,
    timeframe,
    hedgeMode,
    ...params
  } = argv;
  process.env.SET_ID = id;
  const cacheKey = `tester-scenario-set-${process.pid}`;
  const dateStart = new Date(start);
  const dateEnd = new Date(end);
  const dateEndShifted = new Date(dateEnd.setMonth(dateEnd.getMonth() + 1));
  let _lastTick: number;
  let caughtException: boolean = false;
  const lastTick = () => _lastTick;
  const setLastTick = (value) => {
    _lastTick = value;
  };

  async function monitoring(): Promise<void> {
    const progress = !lastTick()
      ? undefined
      : Math.round(((lastTick() - dateStart.getTime()) / (dateEndShifted.getTime() - dateStart.getTime())) * 100);

    const previousUsage = process.cpuUsage();
    const startDate = Date.now();
    while (Date.now() - startDate < 50);
    const usage = process.cpuUsage(previousUsage);
    const result = (100 * (usage.user + usage.system)) / 50000;

    const log = {
      setId: id,
      pid: process.pid,
      cpu: Math.round(result),
      memory: Math.round(process.memoryUsage()?.heapUsed / (1024 * 1024)),
      progress,
    };

    await cacheService.set(cacheKey, JSON.stringify(log), 60 * 60);
    setTimeout(monitoring, 250);
  }

  app.useLogger(logger);

  process.on('uncaughtException', async (e) => {
    await handler.handle(e);
    await cacheService.delete(cacheKey);
  });

  process.on('message', (msg) => {
    switch (msg) {
      case 'force-stop': {
        throw new Error(`Force process STOP`);
      }
      case 'out-of-memory': {
        throw new Error(`Process Out of available memory!`);
      }
      case 'out-of-time': {
        throw new Error(`Process Out of available timeout!`);
      }
    }
  });

  // application logic...
  const env = app.get(ScriptTesterService);
  const dataFeed = app.get(DataFeedFactory);
  dataFeed.setDataFlow('subscriber');

  const symbolInfo = processFactory.getSymbolInfo(symbol);

  const orderService = app.get(OrderService);
  orderService.updateConfig({
    marketOrderSpread,
    pricePrecision: +symbolInfo?.info.pricePrecision,
    defaultLeverage,
    balance,
    takerFee,
    makerFee,
    hedgeMode: ['undefined', 'true'].indexOf(hedgeMode) > -1,
  });

  // env.run();
  await env.runWithParams(id, symbol, timeframe ?? 1, new Date(start), new Date(end), argv);
  monitoring();
  exchangeSdk.watchTicker(symbol, (tick) => {
    if (!tick?.timestamp) return;
    setLastTick(tick?.timestamp);
  });
}

bootstrap();
