import { InjectPinoLogger, Logger, PinoLogger } from 'nestjs-pino';
import { ExceptionHandler } from '@nestjs/core/errors/exception-handler';
import { RuntimeException } from '@nestjs/core/errors/exceptions';
import { ScriptService } from '../environment/script/script.service';
import { ScriptProcessFactory } from '../environment/script/process/script-process.factory';
import { ExceptionReasonType } from './types';
import * as process from 'process';
import { ScriptScenarioStorageService } from '../environment/script/storage/script-scenario-storage.service';

export class ConsoleProcessExceptionHandler implements ExceptionHandler {
  constructor(
    @InjectPinoLogger(ConsoleProcessExceptionHandler.name) private readonly systemLogger: PinoLogger,
    private readonly scriptService: ScriptService,
    private readonly processFactory: ScriptProcessFactory,
    private readonly scenarioStorageService: ScriptScenarioStorageService
  ) {}

  handle = async (
    e: (RuntimeException | Error) & {
      cause?: ExceptionReasonType;
      logger?: Logger;
      key?: string;
      loc?: any;
    },
  ): Promise<void> => {
    if (typeof e.cause !== 'string') {
      e.cause = undefined;
    }
    if (!e.cause && e.stack.indexOf('(vm.js:') > -1) {
      e.cause = ExceptionReasonType.UserScript;
      e.key = '';
    }

    switch (e.cause) {
      case ExceptionReasonType.SDKError: {
        await this.scriptService.stopAll();
        break;
      }

      case ExceptionReasonType.UserScript: {
        const { stack } = e;
        let formattedStack = stack;
        for (let entry of ['at VM2', 'at runInContext', 'at null']) {
          formattedStack = stack && stack?.indexOf(entry) > -1 ? stack.slice(0, stack.indexOf(entry)) : stack;
        }
        // formattedStack = formattedStack.indexOf('node_modules') > -1 ? e.toString() : formattedStack;

        this.systemLogger.error(formattedStack);
        break;
      }

      case ExceptionReasonType.ScriptAlreadyRegistered: {
        break;
      }

      case ExceptionReasonType.TesterDataEnd: {
        await this.scenarioStorageService.markScenarioSetAsDone(parseInt(process.env.SET_ID ?? '0'));
        this.systemLogger.info(e.toString());
        break;
      }

      case ExceptionReasonType.BundlerError:
      default: {
        let msg = e.toString();
        if (e.loc?.file) {
          msg = `${msg} (${e.loc?.file?.replace(process.env.STRATEGY_FILES_PATH, './')}:${e.loc?.line}:${
            e.loc?.column
          })`;
        }
        this.systemLogger.error(msg);
        break;
      }
    }
    await this.scriptService.stopAll();
    setTimeout(process.exit, 1000);
  };
}
