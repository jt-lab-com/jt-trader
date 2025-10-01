import { ExceptionHandler } from '@nestjs/core/errors/exception-handler';
import { InjectPinoLogger, Logger, PinoLogger } from 'nestjs-pino';
import { RuntimeException } from '@nestjs/core/errors/exceptions';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ScriptService } from '../environment/script/script.service';
import { ScriptProcessFactory } from '../environment/script/process/script-process.factory';
import { ExceptionReasonType } from './types';
import * as process from 'process';
import { ScriptArtifactsService } from '../environment/script/artifacts/script-artifacts.service';

export class MainProcessExceptionHandler implements ExceptionHandler {
  constructor(
    @InjectPinoLogger(MainProcessExceptionHandler.name) private readonly systemLogger: PinoLogger,
    private readonly scriptService: ScriptService,
    private readonly emitter: EventEmitter2,
    private readonly processFactory: ScriptProcessFactory,
  ) {}

  handle = (
    e: (RuntimeException | Error) & {
      cause?: ExceptionReasonType;
      logger?: Logger;
      key?: string;
      loc?: any;
      accountId?: any;
      args?: object;
    },
  ): void => {
    let stack;
    try {
      stack = e.stack;
    } catch (e) {
      stack = e.toString();
    }
    this.systemLogger.error({ stack: stack.split('\n'), cause: e.cause, args: e.args }, e.toString());

    if (typeof e.cause !== 'string') {
      e.cause = undefined;
    }
    if (!e.cause && stack.indexOf('(vm.js:') > -1) {
      e.cause = ExceptionReasonType.UserScript;
      e.key = '';
    }

    switch (e.cause) {
      case ExceptionReasonType.SDKError: {
        this.emitter.emit('client.log', {
          processId: '',
          level: 'error',
          message: e.toString(),
        });
        if (e.key) {
          this.processFactory.getRuntimeLogger(e.key.toString()).error(e.toString());
        } else {
          this.processFactory.getAllRuntimeLoggers().map((logger) => {
            logger.error(e.toString());
          });
        }

        void this.scriptService.stopAll(true, true);
        this.emitter.emit('client.update-background-jobs-list');
        break;
      }

      case ExceptionReasonType.BundlerError: {
        let msg = e.toString();
        if (e.loc?.file) {
          msg = `${msg} (${e.loc?.file?.replace(process.env.STRATEGY_FILES_PATH, './')}:${e.loc?.line}:${
            e.loc?.column
          })`;
        }
        this.emitter.emit('client.log', {
          processId: e.key.toString(),
          artifacts: ScriptArtifactsService.createArtifactsKey([e.key.toString(), 'runtime']),
          level: 'error',
          message: msg,
        });
        this.processFactory.getRuntimeLogger(e.key.toString()).error(msg);
        break;
      }

      case ExceptionReasonType.RuntimeScriptLimit:
      case ExceptionReasonType.UserScript: {
        const { stack } = e;
        let formattedStack = stack;
        for (const entry of ['at VM2', 'at runInContext', 'at null']) {
          formattedStack = stack && stack?.indexOf(entry) > -1 ? stack.slice(0, stack.indexOf(entry)) : stack;
        }
        // formattedStack = formattedStack.indexOf('node_modules') > -1 ? e.toString() : formattedStack;

        const errorChunks = formattedStack.split('\n');
        const errorMessage = errorChunks[0];
        const stackTrace = errorChunks.splice(1, Infinity).filter((line) => !!line);

        this.emitter.emit('client.log', {
          processId: e.key.toString(),
          artifacts: ScriptArtifactsService.createArtifactsKey([e.key.toString(), 'runtime']),
          level: 'error',
          message: [errorMessage, { stack: stackTrace }],
        });

        e.logger?.error({ stack: stackTrace }, errorMessage);
        break;
      }

      case ExceptionReasonType.ScriptAlreadyRegistered: {
        this.emitter.emit('client.log', {
          processId: e.key?.toString() ?? ``,
          level: 'error',
          message: e.message,
          accountId: e.accountId,
        });
        break;
      }

      case ExceptionReasonType.TesterDataFailed: {
        break;
      }

      default: {
        void this.scriptService.stopAll(true, true);
        this.emitter.emit('client.update-background-jobs-list');
        this.emitter.emit('client.fatal-error-event');
        this.processFactory.getAllRuntimeLoggers().map((logger) => {
          logger.error(`Fatal system error (see more at sys-log): ${e.toString()}`);
        });
      }
    }
  };

  handleRejection = (reason, promise) => {
    console.error('UnhandledRejection', reason.toString());
    this.handle(reason);
  };
}
