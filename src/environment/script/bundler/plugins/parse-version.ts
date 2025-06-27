import { PinoLogger } from 'nestjs-pino';
import * as acorn from 'acorn';
import { SCRIPT_VERSION_FILENAME } from '../config/const';

export function parseVersionPlugin(filePath: string, logger: PinoLogger) {
  let versionCode: number;

  return {
    name: 'parse-version',
    transform(code: string, id: string) {
      if (id !== filePath) {
        return {
          code,
          map: null,
        };
      }

      const options: acorn.Options = {
        ecmaVersion: 'latest',
        sourceType: 'module',
      };
      const ast = acorn.parse(code, options);

      const findVersion = (ast: acorn.Program) => {
        for (const node of ast.body) {
          if (node.type !== 'ClassDeclaration' && node.type !== 'ExpressionStatement') continue;

          switch (node.type) {
            case 'ClassDeclaration': {
              const versionNode = node.body.body.find(
                (node) =>
                  node.type === 'PropertyDefinition' && node.key.type === 'Identifier' && node.key.name === 'version',
              );

              if (versionNode) {
                // @ts-ignore
                return versionNode.value.raw;
              }
              break;
            }

            case 'ExpressionStatement': {
              if (
                node.expression.type === 'AssignmentExpression' &&
                node.expression.left.type === 'MemberExpression' &&
                node.expression.left.property.type === 'Identifier' &&
                node.expression.left.property.name === 'version' &&
                node.expression.right.type === 'Literal'
              ) {
                return node.expression.right.raw;
              }
            }
          }
        }

        return null;
      };

      const version = findVersion(ast);

      if (!isNaN(parseInt(version))) {
        versionCode = parseInt(version);
      }

      return {
        code,
        map: null,
      };
    },
    generateBundle() {
      if (versionCode) {
        this.emitFile({
          type: 'asset',
          fileName: SCRIPT_VERSION_FILENAME,
          source: versionCode.toString(),
        });
      }
    },
  };
}
