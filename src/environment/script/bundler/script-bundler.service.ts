import { Injectable } from '@nestjs/common';
import typescriptPlugin from '@rollup/plugin-typescript';
import { OutputAsset, rollup, SourceMap } from 'rollup';
import * as path from 'path';
import { SourceMapConsumer } from 'source-map-sync';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ExceptionReasonType } from '../../../exception/types';
import { createInstancePlugin, removeAsyncAwaitPlugin, parseArgumentsPlugin } from './plugins';
import { tsConfig } from './config/ts-config';
import { SiteApi } from '../../../common/api/site-api';
import { DEFINED_ARGS_FILENAME, SCRIPT_VERSION_FILENAME } from './config/const';
import { StrategyItem } from '../types';
import { parseVersionPlugin } from './plugins/parse-version';
import * as virtual from 'rollup-plugin-virtual';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface StrategyBundle {
  content: string;
  sourceMap: SourceMap | string | null;
  getStackTrace: (sourceMap: SourceMap | string, trace?: string) => string | null;
  warn?: string;
  definedArgs?: string;
  version?: number;
}

@Injectable()
export class ScriptBundlerService {
  public sourcePath: string;

  readonly getStackTrace = (sourceMap: SourceMap | string, trace?: string) => {
    if (!sourceMap || !trace) return null;
    return SourceMapConsumer.with(sourceMap, null, (consumer) => {
      const matches = trace.match(/vm\.js:\d+:\d+/g);
      if (!matches) return trace;
      let stack = trace;
      matches.forEach((match) => {
        const [_, line, column] = match.split(':');
        const trace = consumer.originalPositionFor({ line: parseInt(line), column: parseInt(column) });
        stack = stack.replace(match, `${trace.source}:${trace.line}:${trace.column}`);
      });

      return stack;
    });
  };

  constructor(
    @InjectPinoLogger(ScriptBundlerService.name) private readonly logger: PinoLogger,
    private readonly siteApi: SiteApi,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.sourcePath = process.env.STRATEGY_FILES_PATH;
  }

  public async generateBundle(accountId: string, key: string, strategy: StrategyItem): Promise<StrategyBundle> {
    try {
      if (strategy.type === 'local') {
        return await this.build(strategy.path);
      }

      const response = await this.siteApi.getBundle(strategy, accountId);
      const { source_map, defined_args, version } = response;
      let content = response.content;

      if (strategy.mode === 'tester' && process.env.NODE_ENV === 'tester-sync') {
        const bundle = await rollup({
          input: 'entry',
          plugins: [
            virtual({
              entry: content,
            }),
            removeAsyncAwaitPlugin(true),
          ],
        });

        const { output } = await bundle.generate({
          format: 'es',
          name: 'vm.js',
          sourcemap: false,
        });

        content = output[0].code;
      }

      return {
        content,
        getStackTrace: this.getStackTrace,
        sourceMap: source_map,
        definedArgs: JSON.stringify(defined_args),
        version,
      };
    } catch (e) {
      this.eventEmitter.emit('client.notification', {
        accountId,
        message: 'Error while compiling the script. See logs for details.',
        type: 'error',
      });

      e.cause = ExceptionReasonType.BundlerError;
      e.key = key;
      throw e;
    }
  }

  public async buildAndSaveToStore(strategyPath: string, accountId: string): Promise<void> {
    try {
      const { warn, sourceMap, content, definedArgs, version } = await this.build(strategyPath);
      const contentBuffer = Buffer.from(content);
      const sourceMapBuffer = Buffer.from(sourceMap.toString());
      const splitPath = strategyPath.split('/');
      const strategyName = splitPath[splitPath.length - 1];

      await this.siteApi.pushBundle(
        {
          name: strategyName,
          warn,
          sourceMap: sourceMapBuffer,
          content: contentBuffer,
          definedArgs,
          version,
        },
        accountId,
      );
    } catch (e) {
      e.cause = ExceptionReasonType.BundlerError;
      throw e;
    }
  }

  private async build(filePath: string): Promise<StrategyBundle> {
    let warn: string;
    const fullFilePath: string = path.join(this.sourcePath, ...filePath.split('/'));

    const plugins = [
      typescriptPlugin(tsConfig),
      createInstancePlugin(fullFilePath),
      parseArgumentsPlugin(fullFilePath, this.logger),
      parseVersionPlugin(fullFilePath, this.logger),
    ];

    const isSyncTester = process.env.NODE_ENV === 'tester-sync';
    if (isSyncTester) {
      plugins.push(removeAsyncAwaitPlugin());
    }

    const bundle = await rollup({
      input: {
        vm: fullFilePath,
      },
      onwarn: (message) => {
        warn = message.toString();
      },
      plugins,
    });

    const { output } = await bundle.generate({
      format: 'es',
      name: 'vm.js',
      sourcemap: true,
    });

    const content = output[0].code;
    const sourceMap = output[0].map;
    const definedArgsAsset = output.find(
      (asset) => asset.type === 'asset' && asset.fileName === DEFINED_ARGS_FILENAME,
    ) as OutputAsset;
    const definedArgs = definedArgsAsset?.source.toString();
    const versionAsset = output.find(
      (asset) => asset.type === 'asset' && asset.fileName === SCRIPT_VERSION_FILENAME,
    ) as OutputAsset;
    const version = versionAsset?.source.toString();

    await bundle.close();

    return {
      warn,
      content,
      sourceMap,
      getStackTrace: this.getStackTrace,
      definedArgs,
      version: +version,
    };
  }
}
