import { RollupTypescriptPluginOptions } from '@rollup/plugin-typescript';

export const tsConfig: RollupTypescriptPluginOptions = {
  tsconfig: process.env.ROLLUP_TS_CONFIG,
  filterRoot: process.env.STRATEGY_FILES_PATH,
  outputToFilesystem: false,
};
