import * as acorn from 'acorn';
import { SCRIPT_NAMES } from '../config/const';

export function previewExecutionPlugin(filePath?: string) {
  return {
    name: 'preview-execution',
    transform: (code, id) => {
      if (filePath && id !== filePath) {
        return { code, map: null };
      }

      const options: acorn.Options = { ecmaVersion: 'latest', sourceType: 'module' };
      const ast = acorn.parse(code, options);

      const ranges: [number, number][] = [];

      function traverse(node, parent) {
        if (node.type === 'AssignmentExpression') {
          const { left, right } = node;

          if (
            left.type === 'MemberExpression' &&
            left.object.type === 'Identifier' &&
            left.object.name === 'result' &&
            left.property.type === 'Identifier' &&
            left.property.name === 'instance' &&
            right.type === 'NewExpression' &&
            right.callee.type === 'Identifier' &&
            SCRIPT_NAMES.includes(right.callee.name)
          ) {
            if (parent?.type === 'ExpressionStatement') {
              ranges.push([parent.start!, parent.end!]);
            }
          }
        }

        for (const key in node as any) {
          const value = (node as any)[key];
          if (Array.isArray(value)) {
            value.forEach((child) => {
              if (child && typeof child.type === 'string') {
                traverse(child, node);
              }
            });
          } else if (value && typeof value.type === 'string') {
            traverse(value, node);
          }
        }
      }

      traverse(ast, null);

      // if (ranges.length === 0) return null;

      ranges.sort((a, b) => b[0] - a[0]);

      let transformed = code;
      for (const [start, end] of ranges) {
        transformed = transformed.slice(0, start) + '/* removed result.instance */' + transformed.slice(end);
      }

      let className = '';

      for (const node of ast.body) {
        if (node.type !== 'ClassDeclaration') continue;
        className = node.id.name;
        break;
      }

      if (!SCRIPT_NAMES.includes(className)) throw new Error('Script class declaration not found');

      const extendedCodeStrings = [`(async () => { if (${className}.preload) await ${className}.preload(ARGS); })()`];

      return { code: transformed + `\n\n` + extendedCodeStrings.join('\n') };
    },
  };
}
