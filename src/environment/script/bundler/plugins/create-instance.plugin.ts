export function createInstancePlugin(filePath: string) {
  return {
    name: 'create-strategy-instance',
    transform: (code, id) => {
      if (id !== filePath) {
        return {
          code,
          map: null,
        };
      }

      return {
        code: code + '\n\n Error.prepareStackTrace = prepareStackTrace; \n result.instance = new Strategy(ARGS);',
        map: null,
      };
    },
  };
}
