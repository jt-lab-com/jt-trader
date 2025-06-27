export interface BaseScriptInterface {
  symbols: string[];
  connectionName: string;
  interval: number;
  runOnTick: (data) => Promise<void>;
  runOnTimer: () => Promise<void>;
  runOnOrderChange: (data) => Promise<void>;
  runArgsUpdate: (data) => Promise<void>;
  runOnReportAction: (action: string, payload: any) => Promise<void>;
  runOnEvent: (action: string, payload: any) => Promise<void>;
  init: () => Promise<void>;
  run: () => Promise<void>;
  stop: () => Promise<void>;
}
