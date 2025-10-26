import { PinoLogger } from 'nestjs-pino';
import { StrategyDefinedArg } from '@packages/types';
import { parseDefinedArgs } from '../../utils/parse-defined-args';
import { DEFINED_ARGS_FILENAME } from '../config/const';

export function parseArgumentsPlugin(filePath: string, logger: PinoLogger) {
  let definedArguments: StrategyDefinedArg[];

  return {
    name: 'parse-arguments',
    transform(code: string, id: string) {
      if (id !== filePath) {
        return {
          code,
          map: null,
        };
      }

      try {
        definedArguments = parseDefinedArgs(code);
      } catch (e) {
        logger.error({ message: e.message, stack: e.stack?.split('\n') }, 'parseArgumentsPlugin');
      }

      return {
        code,
        map: null,
      };
    },
    generateBundle() {
      if (definedArguments) {
        this.emitFile({
          type: 'asset',
          fileName: DEFINED_ARGS_FILENAME,
          source: JSON.stringify(definedArguments),
        });
      }
    },
  };
}
