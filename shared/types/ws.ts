import { Exchange, MarketType } from './exchange';
import { ExchangeField } from './exchange';
import { Ticker } from 'ccxt';

export enum WS_AUTH_ERROR_CODE {
  INVALID_ACCESS_TOKEN = 4001,
  INVALID_SECRET = 4002,
}

export enum WS_CLIENT_EVENTS {
  LOGIN = 'login',

  /* REALTIME */
  BACKGROUND_JOBS_LIST_REQUEST = 'background-jobs-list-request',
  RUN_BACKGROUND_JOB_REQUEST = 'run-background-job-request',
  STOP_BACKGROUND_JOB_REQUEST = 'stop-background-job-request',
  SAVE_BACKGROUND_JOB_REQUEST = 'save-background-job-request',
  REMOVE_BACKGROUND_JOB_REQUEST = 'remove-background-job-request',
  PREVIEW_EXECUTION_REQUEST = 'preview-execution-request',

  /* REPORT */
  REPORT_ACTION_REQUEST = 'report-action-request',

  /* TESTER */
  TESTER_SCENARIO_LIST_REQUEST = 'tester-scenario-list-request',
  CREATE_TESTER_SCENARIO = 'create-tester-scenario',
  RUN_TESTER_SCENARIO = 'run-tester-scenario',
  RUN_TESTER_SCENARIO_SYNC = 'run-tester-scenario-sync',
  REMOVE_TESTER_SCENARIO = 'remove-tester-scenario',
  STOP_ALL_TESTER_SCENARIO = 'stop-all-tester-scenario',

  /* STRATEGY */
  STRATEGY_LIST_REQUEST = 'strategies-list-request',
  REMOTE_STRATEGY_LIST_REQUEST = 'remote-strategy-list-request',
  STRATEGY_CONTENT_REQUEST = 'strategy-content-request',

  BUILD_BUNDLE_REQUEST = 'build-bundle-request',

  /* EXCHANGE CONFIG */
  EXCHANGE_CONFIG_REQUEST = 'exchange-config-request',
  EXCHANGE_CONFIG_SAVE = 'exchange-config-save',
  EXCHANGE_CONFIG_DELETE = 'exchange-config-delete',

  EXCHANGE_MARKETS_REQUEST = 'exchange-markets-request',

  TESTER_HISTORICAL_BARS_REQUEST = 'tester-historical-bars-request',
  RUNTIME_HISTORICAL_BARS_REQUEST = 'runtime-historical-bars-request',

  SUBSCRIBE_REALTIME_TICKER_REQUEST = 'subscribe-realtime-ticker-request',
  UNSUBSCRIBE_REALTIME_TICKER_REQUEST = 'unsubscribe-realtime-ticker-request',

  LOGS_LIST_REQUEST = 'logs-list-request',

  ARTIFACTS_REQUEST = 'artifacts-request',

  REBOOT_SYSTEM_REQUEST = 'reboot-system-request',
  INVALIDATE_CACHE_REQUEST = 'invalidate-cache-request',
  PULL_USER_SOURCE_CODE_REQUEST = 'pull-user-source-code-request',

  ENGINE_CONFIG_REQUEST = 'engine-config-request',
}

export type WS_CLIENT_EVENT_PAYLOAD = {
  [WS_CLIENT_EVENTS.LOGIN]: { email: string; password: string };

  [WS_CLIENT_EVENTS.BACKGROUND_JOBS_LIST_REQUEST]: undefined;
  [WS_CLIENT_EVENTS.RUN_BACKGROUND_JOB_REQUEST]: number;
  [WS_CLIENT_EVENTS.STOP_BACKGROUND_JOB_REQUEST]: number;
  [WS_CLIENT_EVENTS.SAVE_BACKGROUND_JOB_REQUEST]: SaveJobParams | CopyJobParams;
  [WS_CLIENT_EVENTS.REMOVE_BACKGROUND_JOB_REQUEST]: number;
  [WS_CLIENT_EVENTS.PREVIEW_EXECUTION_REQUEST]: PreviewExecutionRequestPayload;

  [WS_CLIENT_EVENTS.TESTER_SCENARIO_LIST_REQUEST]: undefined;
  [WS_CLIENT_EVENTS.CREATE_TESTER_SCENARIO]: CreateScenarioParams;
  [WS_CLIENT_EVENTS.RUN_TESTER_SCENARIO]: number;
  [WS_CLIENT_EVENTS.RUN_TESTER_SCENARIO_SYNC]: number;
  [WS_CLIENT_EVENTS.REMOVE_TESTER_SCENARIO]: number;
  [WS_CLIENT_EVENTS.STOP_ALL_TESTER_SCENARIO]: undefined;

  [WS_CLIENT_EVENTS.STRATEGY_LIST_REQUEST]: undefined;
  [WS_CLIENT_EVENTS.REMOTE_STRATEGY_LIST_REQUEST]: undefined;
  [WS_CLIENT_EVENTS.STRATEGY_CONTENT_REQUEST]: string;

  [WS_CLIENT_EVENTS.BUILD_BUNDLE_REQUEST]: BuildBundleParams;

  [WS_CLIENT_EVENTS.EXCHANGE_CONFIG_REQUEST]: undefined;
  [WS_CLIENT_EVENTS.EXCHANGE_CONFIG_SAVE]: SaveExchangeConfigParams;
  [WS_CLIENT_EVENTS.EXCHANGE_CONFIG_DELETE]: string[];

  [WS_CLIENT_EVENTS.EXCHANGE_MARKETS_REQUEST]: ExchangeMarketsRequestParams;

  [WS_CLIENT_EVENTS.LOGS_LIST_REQUEST]: string;

  [WS_CLIENT_EVENTS.ARTIFACTS_REQUEST]: string;

  [WS_CLIENT_EVENTS.REBOOT_SYSTEM_REQUEST]: undefined;
  [WS_CLIENT_EVENTS.INVALIDATE_CACHE_REQUEST]: undefined;
  [WS_CLIENT_EVENTS.PULL_USER_SOURCE_CODE_REQUEST]: undefined;

  [WS_CLIENT_EVENTS.ENGINE_CONFIG_REQUEST]: undefined;

  [WS_CLIENT_EVENTS.TESTER_HISTORICAL_BARS_REQUEST]: HistoricalTesterBarsRequestParams;
  [WS_CLIENT_EVENTS.RUNTIME_HISTORICAL_BARS_REQUEST]: HistoricalRuntimeBarsRequestParams;

  [WS_CLIENT_EVENTS.SUBSCRIBE_REALTIME_TICKER_REQUEST]: SubscribeRealtimeTickerRequestParams;
  [WS_CLIENT_EVENTS.UNSUBSCRIBE_REALTIME_TICKER_REQUEST]: UnsubscribeRealtimeTickerRequestParams;

  [WS_CLIENT_EVENTS.REPORT_ACTION_REQUEST]: ReportActionButtonRequestPayload;
};

export enum WS_SERVER_EVENTS {
  AUTHENTICATED = 'authenticated',
  UNAUTHORIZED_RESPONSE = 'unauthorized',

  LOGIN_RESPONSE = 'login-response',

  BACKGROUND_JOBS_LIST_RESPONSE = 'background-jobs-list-response',

  PREVIEW_EXECUTION_RESPONSE = 'preview-execution-response',

  TESTER_SCENARIO_LIST_RESPONSE = 'tester-scenario-list-response',
  TESTER_SCENARIO_EXEC_INFO = 'tester-scenario-exec-info',
  TESTER_SCENARIO_PREPARE_DATA_START = 'tester-scenario-prepare-data-start',
  TESTER_SCENARIO_PREPARE_DATA_END = 'tester-scenario-prepare-data-end',

  CLIENT_NOTIFICATION = 'client-notification',

  STRATEGY_LIST_RESPONSE = 'strategies-list-response',
  REMOTE_STRATEGY_LIST_RESPONSE = 'remote-strategy-list-response',
  STRATEGY_CONTENT_RESPONSE = 'strategy-content-response',

  CODE_EDITOR_FILE_TREE_RESPONSE = 'strategy-file-tree-response',
  CODE_EDITOR_FILE_SAVE_RESPONSE = 'strategy-save-response',
  CODE_EDITOR_FILE_RENAME_RESPONSE = 'strategy-save-response',
  CODE_EDITOR_FILE_CONTENT_RESPONSE = 'strategies-file-tree-content-response',
  CODE_EDITOR_BUILD_BUNDLE_RESPONSE = 'strategy-save-push-bundle-response',

  /* REPORT */
  REPORT_ACTION_RESPONSE = 'report-action-response',

  /* EXCHANGE CONFIG */
  EXCHANGE_CONFIG_RESPONSE = 'exchange-config-response',

  EXCHANGE_MARKETS_RESPONSE = 'exchange-markets-response',

  TESTER_HISTORICAL_BARS_RESPONSE = 'tester-historical-bars-response',
  RUNTIME_HISTORICAL_BARS_RESPONSE = 'runtime-historical-bars-response',

  SUBSCRIBE_REALTIME_TICKER_RESPONSE = 'subscribe-realtime-ticker-response',
  UNSUBSCRIBE_REALTIME_TICKER_RESPONSE = 'unsubscribe-realtime-ticker-response',
  REALTIME_TICKER = 'realtime-ticker',

  SYSTEM_MESSAGE = 'system-message',

  LOGS_LIST_RESPONSE = 'logs-list-response',

  ARTIFACTS_RESPONSE = 'artifacts-response',

  USER_SCRIPT_LOG = 'user-script-log',

  UPDATE_REPORT = 'update-report',

  PULL_USER_SOURCE_CODE_RESPONSE = 'pull-user-source-code-response',

  ENGINE_CONFIG_RESPONSE = 'engine-config-response',

  INVALIDATE_CACHE_RESPONSE = 'invalidate-cache-response',
}

export type WS_SERVER_EVENT_PAYLOAD = {
  [WS_SERVER_EVENTS.AUTHENTICATED]: { id: number; email: string; engineMode: string };
  [WS_SERVER_EVENTS.UNAUTHORIZED_RESPONSE]: { code: number };
  [WS_SERVER_EVENTS.LOGIN_RESPONSE]: { error: boolean; accessToken: string; message: string };

  [WS_SERVER_EVENTS.CLIENT_NOTIFICATION]: ClientNotificationPayload;

  [WS_SERVER_EVENTS.BACKGROUND_JOBS_LIST_RESPONSE]: Job[];
  [WS_SERVER_EVENTS.PREVIEW_EXECUTION_RESPONSE]: PreviewExecutionResponsePayload;

  // [WS_SERVER_EVENTS.TESTER_SCENARIO_LIST_RESPONSE]: ScenarioInterface[];
  [WS_SERVER_EVENTS.TESTER_SCENARIO_LIST_RESPONSE]: any[];
  [WS_SERVER_EVENTS.TESTER_SCENARIO_EXEC_INFO]: ScenarioExecInfo;

  [WS_SERVER_EVENTS.TESTER_SCENARIO_PREPARE_DATA_START]: TesterScenarioPrepareDataStartPayload;
  [WS_SERVER_EVENTS.TESTER_SCENARIO_PREPARE_DATA_END]: undefined;

  [WS_SERVER_EVENTS.STRATEGY_LIST_RESPONSE]: StrategyListResponsePayload;
  [WS_SERVER_EVENTS.REMOTE_STRATEGY_LIST_RESPONSE]: RemoteStrategyListResponsePayload;
  [WS_SERVER_EVENTS.STRATEGY_CONTENT_RESPONSE]: StrategyContentResponsePayload;

  [WS_SERVER_EVENTS.CODE_EDITOR_FILE_TREE_RESPONSE]: FileTree;
  [WS_SERVER_EVENTS.CODE_EDITOR_FILE_CONTENT_RESPONSE]: FileContentResponsePayload;
  [WS_SERVER_EVENTS.CODE_EDITOR_FILE_SAVE_RESPONSE]: FileSaveResponsePayload;
  [WS_SERVER_EVENTS.CODE_EDITOR_FILE_RENAME_RESPONSE]: FileRenameResponsePayload;

  [WS_SERVER_EVENTS.REPORT_ACTION_RESPONSE]: ReportActionButtonResponsePayload;

  /* EXCHANGE CONFIG */
  [WS_SERVER_EVENTS.EXCHANGE_CONFIG_RESPONSE]: ExchangeConfigResponsePayload;

  [WS_SERVER_EVENTS.TESTER_HISTORICAL_BARS_RESPONSE]: TesterHistoricalBarsResponsePayload;
  [WS_SERVER_EVENTS.RUNTIME_HISTORICAL_BARS_RESPONSE]: RuntimeHistoricalBarsResponsePayload;

  [WS_SERVER_EVENTS.REALTIME_TICKER]: RealtimeTickerPayload;
  [WS_SERVER_EVENTS.SUBSCRIBE_REALTIME_TICKER_RESPONSE]: SubscribeRealtimeTickerResponsePayload;
  [WS_SERVER_EVENTS.UNSUBSCRIBE_REALTIME_TICKER_RESPONSE]: number;

  [WS_SERVER_EVENTS.SYSTEM_MESSAGE]: SystemMessagePayload;

  [WS_SERVER_EVENTS.LOGS_LIST_RESPONSE]: LogsListResponsePayload;

  [WS_SERVER_EVENTS.ARTIFACTS_RESPONSE]: ArtifactsResponsePayload;

  [WS_SERVER_EVENTS.USER_SCRIPT_LOG]: UserLogsUpdatePayload;

  [WS_SERVER_EVENTS.UPDATE_REPORT]: ReportActionButtonRequestPayload;
  [WS_SERVER_EVENTS.PULL_USER_SOURCE_CODE_RESPONSE]: PullUserSourceCodeResponsePayload;
  [WS_SERVER_EVENTS.CODE_EDITOR_BUILD_BUNDLE_RESPONSE]: SavePushBundleResponsePayload;

  [WS_SERVER_EVENTS.ENGINE_CONFIG_RESPONSE]: EngineConfigResponsePayload;

  [WS_SERVER_EVENTS.INVALIDATE_CACHE_RESPONSE]: undefined;

  [WS_SERVER_EVENTS.EXCHANGE_MARKETS_RESPONSE]: ExchangeMarketsResponsePayload;
};

export interface PreviewExecutionRequestPayload {
  key: string;
  strategy: Strategy;
  args: { exchange: string; symbols: string[] } & Record<string, unknown>;
}

export interface PreviewExecutionResponsePayload {
  key: string;
  data: any;
}

interface ClientNotificationPayload {
  message: string;
  type: ClientNotificationType;
}

export enum ClientNotificationType {
  Error = 'error',
  Info = 'info',
  Warning = 'warning',
  Success = 'success',
}

interface EngineConfigResponsePayload {
  version: string;
  testerDefaults: TesterDefaultArgs;
}

export interface TesterDefaultArgs {
  start: string;
  end: string;
  marketOrderSpread: number;
  makerFee: number;
  takerFee: number;
  defaultLeverage: number;
  timeframe: number;
  hedgeMode: boolean;
  symbols: string[];
  exchange: string;
  balance: number;
}

export interface ExchangeConfigResponsePayload {
  main: Exchange[];
  additional?: Exchange[];
}

export interface PullUserSourceCodeResponsePayload {
  error: boolean;
  message: string;
}

export interface SavePushBundleResponsePayload {
  error: boolean;
  message?: string;
}

export interface UserLogsUpdatePayload {
  log: Log;
  processId: number;
  artifacts: string;
}

export interface ArtifactsResponsePayload {
  artifacts: string;
  // data: Artifact;
  data: any;
}

export interface SystemMessagePayload {
  type: 'error' | 'info' | 'warning' | 'success';
  message: string;
}

export interface LogsListResponsePayload {
  artifacts: string;
  data: Log[];
}

export interface Log {
  level: LogLevel;
  time: number;
  msg: string;
  [key: string]: any;
}

export type LogLevel = 'debug' | 'error' | 'info' | 'warn';

export interface RuntimeHistoricalBarsResponsePayload {
  requestId: string;
  symbol: string;
  timeframe: string;
  data: CandleStick[];
}

export interface TesterHistoricalBarsResponsePayload {
  requestId: string;
  symbol: string;
  timeframe: string;
  data: Blob;
}

export interface SubscribeRealtimeTickerResponsePayload {
  error: boolean;
  subId: number | null;
}

export interface RealtimeTickerPayload {
  exchange: string;
  symbol: string;
  ticker: Ticker;
}

export interface CandleStick {
  time: number;
  open: number;
  close: number;
  high: number;
  low: number;
  volume?: number;
}

export interface FileContentResponsePayload {
  path: string;
  filename: string;
  content: string;
}

export interface FileSaveResponsePayload {
  error: boolean;
}

export interface FileRenameResponsePayload {
  error: boolean;
}

export type FileTree = Array<FileItem | DirItem>;

export interface FileItem {
  type: 'file';
  path: string;
  name: string;
  content: string;
}

export interface DirItem {
  type: 'dir';
  name: string;
  path: string;
  children: FileTree;
}

export interface TesterScenarioPrepareDataStartPayload {
  symbol: string;
}

export type StrategyListResponsePayload = Strategy[];

export interface RemoteStrategyListResponsePayload {
  bundles: Strategy[];
  appBundles: Strategy[];
}

export interface StrategyDefinedArg {
  key: string;
  mode?: 'runtime' | 'tester';
  defaultValue?: string;
  options?: StrategyDefinedArgOption[];
  filters?: StrategyDefinedArgsFilters;
}

export interface StrategyDefinedArgsFilters {
  volume?: { min?: number };
  leverage?: { min?: number };
  maxSymbols?: number;
  autoSelect?: number;
}

export interface StrategyDefinedArgOption {
  value: string;
  label: string;
}

export interface Strategy {
  id: string;
  name: string;
  type: StrategyType;
  version?: string;
  definedArgs?: StrategyDefinedArg[];
  bundleName?: string;
  path?: string;
  mode?: 'runtime' | 'tester';
}

export type StrategyType = 'local' | 'bundle' | 'app';

export interface StrategyContentResponsePayload {
  strategy: string;
  content: string;
}

export interface ScenarioExecInfo {
  setId: number;
  progress: number;
  pid: number;
  cpu: number;
  memory: number;
}

export interface StrategyArg {
  key: string;
  value: string;
  mode?: 'runtime' | 'tester';
}

export type JobRuntimeType = 'market' | 'system';

export interface Job {
  id: number;
  prefix: string;
  name: string;
  content: string;
  isEnabled: boolean;
  strategy: Strategy;
  runtimeType: JobRuntimeType;
  exchange: string;
  marketType?: MarketType;
  artifacts: string;
  args: StrategyArg[];
  createdAt: string;
  updatedAt: string;
}

export interface Scenario {
  id: number;
  strategy: Strategy;
  name: string;
  dynamicArgs: ScenarioScope[];
  sets: ScenarioSet[];
  args: StrategyArg[];
  withOptimizer: boolean;
  marketOrderSpread: number;
  makerFee: number;
  takerFee: number;
  exchange: string;
  balance: number;
  defaultLeverage: number;
  timeframe: number;
  symbols: string[];
  start: string; // yyyy-mm format
  end: string; // yyyy-mm format
  artifacts: string;
  hedgeMode?: boolean;
}

export interface ScenarioSet {
  id: number;
  args: ScenarioSetArg[];
  artifacts: string;
  status: 0 | 1 | 2 | 3;
}

export interface ScenarioSetArg {
  key: string;
  value: string;
}

export interface BuildBundleParams {
  filePath: string;
}

export interface CreateScenarioParams {
  symbols: string[];
  start: string;
  end: string;
  name: string;
  withOptimizer: boolean;
  marketOrderSpread: number;
  makerFee: number;
  takerFee: number;
  defaultLeverage: number;
  timeframe: number;
  hedgeMode: boolean;
  balance: number;
  exchange: string;
  args: StaticScopeParam[];
  scope: ScenarioScope[];
  strategy: Strategy;
}

export type StaticScopeParam = { key: string; value: number | string };
type ParamName = string;
type Begin = number;
type End = number;
type Step = number;

export type ScenarioScope = [ParamName, Begin, End, Step];

export interface SaveJobParams {
  prefix: string;
  id?: number;
  name: string;
  strategy: Strategy;
  exchange: string;
  marketType: MarketType;
  args: StrategyArg[];
  runtimeType: 'market' | 'system';
}

export type CopyJobParams = Omit<SaveJobParams, 'id'>;

export interface ExchangeMarketsRequestParams {
  exchange: string;
  marketType: MarketType;
}

export interface HistoricalTesterBarsRequestParams {
  requestId?: string;
  symbol: string;
  timeframe: string;
  date: Date;
}

interface HistoricalRuntimeBarsRequestParams {
  symbol: string;
  timeframe: string;
  startTime: number;
  endTime: number;
  requestId: string;
  limit?: number;
  exchange: string;
}

interface SubscribeRealtimeTickerRequestParams {
  exchange: string;
  marketType: MarketType;
  symbol: string;
  listenerId: string;
}

interface UnsubscribeRealtimeTickerRequestParams {
  listenerId: string;
}

export type SaveExchangeConfigParams = Array<ExchangeField & { value: string | boolean }>;

export interface ReportActionButtonRequestPayload {
  artifacts: string;
  requestId: string;
  action: string;
  payload: string | number | object;
}

export interface ReportActionButtonResponsePayload {
  requestId: string;
  error: boolean;
  message?: string;
  data?: any;
}

export interface ExchangeMarketsResponsePayload {
  exchange: string;
  marketType: MarketType;
  data: ExchangeMarkets[];
}

export interface ExchangeMarkets {
  id: string;
  symbol: string;
  base: string;
  quoteVolume: number;
  contractSize: number;
  close: number;
  precision: {
    amount: number;
  };
  limits: ExchangeMarketLimits;
}

export interface ExchangeMarketLimits {
  leverage: { max: number };
}
