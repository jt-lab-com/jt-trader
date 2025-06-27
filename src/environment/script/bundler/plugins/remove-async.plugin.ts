import * as parser from '@babel/parser';
import traverse, { Node, NodePath } from '@babel/traverse';
import generate from '@babel/generator';

const reservedAsyncClassNames = ['ExtendedScript', 'Strategy', 'CandlesBuffer'];
const reservedAsyncMethods = ['init', 'onInit'];

export function removeAsyncPlugin(isTester?: boolean) {
  return {
    name: 'remove-async-await',
    transform(code: string, id: string) {
      if (!isTester) {
        if (!id.endsWith('.js') && !id.endsWith('.ts')) {
          return null;
        }
      }

      const ast = parser.parse(code, {
        sourceType: 'module',
      });

      let isInitMethod = false;

      traverse(ast as Node, {
        ClassMethod(path) {
          const classNode = path.findParent((parent) => parent.isClassDeclaration());

          isInitMethod =
            // @ts-ignore
            reservedAsyncClassNames.includes(classNode.node.id.name) &&
            // @ts-ignore
            reservedAsyncMethods.includes(path.node.key.name);

          if (isInitMethod) return;

          if (path.node.async) {
            path.node.async = false;
          }
        },
        FunctionDeclaration(path) {
          if (path.node.async) {
            path.node.async = false;
          }
        },
        FunctionExpression(path) {
          if (path.node.async) {
            path.node.async = false;
          }
        },
        ArrowFunctionExpression(path) {
          isInitMethod = isInsideInitMethod(path);

          if (isInitMethod) return;

          if (path.node.async) {
            path.node.async = false;
          }
        },
        AwaitExpression(path) {
          if (isInitMethod) return;

          path.replaceWith(path.node.argument);
        },
      });

      // @ts-ignore
      const transformedCode = generate(ast, { comments: false }).code;

      return {
        code: transformedCode,
        map: null,
      };
    },
  };
}

const isInsideInitMethod = (path: NodePath) => {
  const classNode = path.findParent((path) => path.isClassDeclaration() || path.isClassDeclaration());
  const method = path.findParent((path) => path.isClassProperty() || path.isClassMethod());

  if (!classNode || !method) return false;

  return (
    // @ts-ignore
    reservedAsyncClassNames.includes(classNode?.node?.id?.name) &&
    // @ts-ignore
    reservedAsyncMethods.includes(method?.node?.key?.name)
  );
};
