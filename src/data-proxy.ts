import { NestFactory } from '@nestjs/core';
import { DataProxyModule } from './data-proxy/data-proxy.module';
import { Logger } from 'nestjs-pino';

(async function () {
  const app = await NestFactory.createApplicationContext(DataProxyModule, { bufferLogs: true });
  const logger = app.get(Logger);
  app.useLogger(logger);
})();
