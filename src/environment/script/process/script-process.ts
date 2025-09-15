import { VM, VMScript } from 'vm2';
import { ScriptProcessContext } from './script-process-context';
import { StrategyBundle } from '../bundler/script-bundler.service';
import { BaseScriptInterface } from '../../../common/types';
import { EventEmitter } from 'events';
import { performance } from 'node:perf_hooks';
import { ScriptProcessContextSync } from './script-process-context-sync';
import { getAllObjectMethods } from '../../../common/utils';
import { StrategyArgsType } from '../../exchange/interface/strategy.interface';

export class ScriptProcess {
  private _instance: BaseScriptInterface;
  private _error: string;
  private _vm: VM;
  private isInited: boolean;
  private isStarted: boolean;
  private isStopped: boolean;

  constructor(private readonly context: ScriptProcessContext | ScriptProcessContextSync, args?: object) {
    const keys = getAllObjectMethods(context);
    const sandbox: any = keys
      .filter((method) => method.slice(0, 1) !== '_')
      .reduce(
        (acc, method) => ({
          ...acc,
          [method]: (...args) => {
            return context[method](...args);
          },
        }),
        {
          EventEmitter,
          performance,
          ARGS: args,
          console: {
            log: (...rest) => context._log('info', rest),
            warn: (...rest) => context._log('warn', rest),
            error: (...rest) => context._log('error', rest),
          },
        },
      );

    sandbox.result = {};

    this._vm = new VM({ sandbox, allowAsync: true, eval: false });
  }

  async init(bundle: StrategyBundle) {
    const { content } = bundle;
    this._instance = this._vm.run(new VMScript(content));
    await this.context.updateArgs(this._instance);
    await this._instance.init();
    this.isInited = true;
  }

  async previewExecution(bundle: StrategyBundle, args: StrategyArgsType) {
    const { content } = bundle;
    await this.context.updateArgs(
      {
        connectionName: args.connectionName,
        symbols: args.symbols,
        interval: 1,
      } as BaseScriptInterface,
      false,
    );
    this._instance = await this._vm.run(new VMScript(content));
    return this.context.getArtifactsKey();
  }

  async start() {
    if (this.isStarted) return;
    this.isStarted = true;

    await this._instance.run();
    this.context.subscribeDataFeeds();
  }

  async stop(): Promise<void> {
    if (this.isStopped) return;
    this.isStopped = true;

    if (this.isInited) {
      this.context.unsubscribeDataFeeds();
      await this._instance.stop();
    }
  }

  updateArgs(args: object): Promise<void> {
    return this._instance.runArgsUpdate(args);
  }

  reportAction(action: string, payload: any): Promise<void> {
    return this._instance.runOnReportAction(action, payload);
  }

  get instance(): BaseScriptInterface {
    return this._instance;
  }

  get error(): string | undefined {
    return this._error;
  }
}
