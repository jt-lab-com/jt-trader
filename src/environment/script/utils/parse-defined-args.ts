import * as acorn from 'acorn';
import tsPlugin from 'acorn-typescript';
import { StrategyDefinedArg } from '@packages/types';
import { SCRIPT_NAMES } from '../bundler/config/const';

export function parseDefinedArgs(code: string, isTypeScript?: boolean): StrategyDefinedArg[] | null {
  let ast: acorn.Program;
  const options: acorn.Options = {
    ecmaVersion: 'latest',
    sourceType: 'module',
  };

  if (isTypeScript) {
    // @ts-ignore
    ast = acorn.Parser.extend(tsPlugin()).parse(code, options);
  } else {
    ast = acorn.parse(code, options);
  }

  const findNodePosition = (ast: acorn.Program) => {
    for (const node of ast.body) {
      if (!['ClassDeclaration', 'ExpressionStatement'].includes(node.type)) continue;

      if (node.type === 'ClassDeclaration') {
        const definedArgsNode = node.body.body.find(
          (node) =>
            node.type === 'PropertyDefinition' && node.key.type === 'Identifier' && node.key.name === 'definedArgs',
        );
        if (definedArgsNode) {
          // @ts-ignore
          return { start: definedArgsNode.value.start, end: definedArgsNode.value.end };
        }
      }

      if (
        node.type === 'ExpressionStatement' &&
        node.expression.type === 'AssignmentExpression' &&
        node.expression.left.type === 'MemberExpression' &&
        node.expression.left.property.type === 'Identifier' &&
        node.expression.left.property.name === 'definedArgs'
      ) {
        return { start: node.expression.start, end: node.expression.end };
      }
    }

    return null;
  };

  const definedArgsPosition = findNodePosition(ast);

  let className = '';

  for (const node of ast.body) {
    if (node.type !== 'ClassDeclaration') continue;
    className = node.id.name;
    break;
  }

  if (!SCRIPT_NAMES.includes(className)) throw new Error('Script class declaration not found');

  if (!definedArgsPosition) return null;

  const definedArgsJSON = code
    .substring(definedArgsPosition.start, definedArgsPosition.end)
    .replace(isTypeScript ? 'static definedArgs = ' : `${className}.definedArgs = `, '')
    .replace(';', '')
    .replace(/'/g, '"')
    .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
    .replace(/,\s*([}\]])/g, '$1');

  return JSON.parse(definedArgsJSON);
}
