import * as acorn from 'acorn';
import acornTs from 'acorn-typescript';
import { SCRIPT_NAMES } from '../config/const';

export function createInstancePlugin(filePath: string, isTypescript?: boolean) {
  return {
    name: 'create-strategy-instance',
    transform: (code, id) => {
      if (id !== filePath) {
        return {
          code,
          map: null,
        };
      }

      let ast: acorn.Program;
      const options: acorn.Options = { ecmaVersion: 'latest', sourceType: 'module' };

      if (isTypescript) {
        // @ts-ignore
        ast = acorn.Parser.extend(acornTs()).parse(code, options);
      } else {
        ast = acorn.parse(code, options);
      }

      let className = '';

      for (const node of ast.body) {
        if (node.type !== 'ClassDeclaration') continue;
        className = node.id.name;
        break;
      }

      if (!SCRIPT_NAMES.includes(className)) throw new Error('Script class declaration not found');

      const extendCodeStrings = [
        'Error.prepareStackTrace = prepareStackTrace;',
        `result.instance = new ${className}(ARGS);`,
      ];

      return {
        code: code + '\n\n' + extendCodeStrings.join('\n'),
        map: null,
      };
    },
  };
}
