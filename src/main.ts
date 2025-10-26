import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app/app.module';
import { MainProcessExceptionHandler } from './exception/main-process-exception.handler';
import { EventsGateway } from './events/events.gateway';
import { ScriptService } from './environment/script/script.service';
import * as path from 'path';

process.env.CONSOLE_MODULE_PATH = path.join(__dirname, 'console.js');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(Logger);
  const scriptService = app.get(ScriptService);
  app.useLogger(logger);

  const handler = app.get(MainProcessExceptionHandler);
  const eventsGateway = app.get(EventsGateway);
  eventsGateway.registerErrorHandler(handler);

  process.on('uncaughtExceptionMonitor', handler.handle);
  process.on('unhandledRejection', handler.handleRejection);

  process.on('SIGINT', async (signal) => {
    await scriptService.stopAll();
    console.log(`Process ${process.pid} has been SIGINT`);
    return process.exit(0);
  });
  console.log(`REGISTRED SIGINT!`);

  try {
    // Restore running scripts after restart or crash
    await scriptService.restoreRunningProcesses();
  } catch (e) {
    logger.error({ stack: e.stack?.split('\n') }, 'Failed to restore runtime' + e.toString());
  }

  await app.listen(process.env.PORT);
}

bootstrap();
