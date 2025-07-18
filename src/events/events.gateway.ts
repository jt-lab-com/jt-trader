import * as fs from 'fs';
import { execSync } from 'child_process';
import { Server } from 'socket.io';
import { Ticker } from 'ccxt';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ExceptionHandler } from '@nestjs/core/errors/exception-handler';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { ScriptService } from '../environment/script/script.service';
import { ScriptScenarioService } from '../environment/script/scenario/script-scenario.service';
import { ScriptTesterService } from '../environment/script-tester/script-tester.service';
import { ScriptLogsService } from '../environment/script/artifacts/script-logs.service';
import { ScriptArtifactsService } from '../environment/script/artifacts/script-artifacts.service';
import { WS_CLIENT_EVENT_PAYLOAD, WS_CLIENT_EVENTS, WS_SERVER_EVENTS } from '@packages/types';
import { ExchangeConnectorService } from '../environment/exchange/exchange-connector/exchange-connector.service';
import { AccountService } from '../environment/account/account.service';
import { DataFeedFactory } from '../environment/data-feed/data-feed.factory';
import { ConnectionService } from './connection.service';
import { CCXTService } from '../environment/exchange/ccxt.service';
import { SocketClient } from './types';
import { ScriptBundlerService } from '../environment/script/bundler/script-bundler.service';
import { AxiosError } from 'axios';
import { TESTER_SCENARIO_DEFAULTS } from '../environment/account/const';
import { HistoryBarsService } from '../environment/history-bars/history-bars.service';
import { MonitoringService } from '../monitoring/monitoring.service';
import { SiteApi } from '../common/api/site-api';

@WebSocketGateway()
export class EventsGateway implements OnGatewayDisconnect, OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  errorHandlers: ExceptionHandler[] = [];

  constructor(
    @InjectPinoLogger(EventsGateway.name) private readonly logger: PinoLogger,
    private readonly scriptService: ScriptService,
    private readonly scenarioService: ScriptScenarioService,
    private readonly testerService: ScriptTesterService,
    private readonly scriptArtifactService: ScriptArtifactsService,
    private readonly scriptLogsService: ScriptLogsService,
    private readonly historyBarsService: HistoryBarsService,
    private readonly exchangeConnectorService: ExchangeConnectorService,
    private readonly dataFeedFactory: DataFeedFactory,
    private readonly connectionService: ConnectionService,
    private readonly ccxtService: CCXTService,
    private readonly accountService: AccountService,
    private readonly scriptBundlerService: ScriptBundlerService,
    private readonly monitoringService: MonitoringService,
    private readonly siteApi: SiteApi,
  ) {}

  registerErrorHandler(handler: ExceptionHandler) {
    this.errorHandlers.push(handler);
  }

  async handleConnection(client: SocketClient, ...args: any[]): Promise<void> {
    const { accessToken, accessSecret } = client.handshake.auth;

    const { error, data, errorCode } = await this.connectionService.authUser(client, accessToken, accessSecret);

    if (!error && !!data.id) {
      client.emit('message', { event: 'authenticated', payload: { ...data, engineMode: process.env.ENGINE_MODE } });
      client.user = data;
      // this.logger.info({ socketId: client.id, accountId: data.id }, 'Socket Connected');

      return;
    }

    client.emit('message', { event: 'unauthorized', payload: { code: errorCode } });
    this.logger.error({ socketId: client.id }, 'Socket auth error');
    // client.disconnect();
  }

  handleDisconnect(client: SocketClient): any {
    const userConnections = this.connectionService.getUserConnections(client.user?.id);

    if (userConnections?.socketClients.length === 1) {
      userConnections.exchangeTickerSubscribes.forEach(({ exchange, symbol, datafeedSubId }) => {
        this.dataFeedFactory.unsubscribeTicker(exchange, symbol, datafeedSubId);
      });

      this.connectionService.removeConnection(client.id, client.user?.id);
    }

    // this.logger.info({ socketId: client.id, accountId: client.user?.id }, 'Socket Disconnected');
  }

  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody() data: { event: WS_CLIENT_EVENTS; payload: any },
    @ConnectedSocket() client: SocketClient,
  ): Promise<WsResponse<{ event: string; payload: any }>> {
    try {
      this.logger.debug(data, 'log msg');
      const response = await this.processMessage(client, data.event, data.payload);
      if (!!response) return { event: 'message', data: response };
    } catch (e) {
      this.errorHandlers.map((handler) => {
        handler.handle(e);
      });
    }
  }

  @OnEvent('client.prepare-tester-source-start')
  async prepareTesterSourceStart(payload: { accountId: string; symbol: string }) {
    const connection = this.connectionService.getUserConnections(payload.accountId);
    connection.socketClients.forEach((client) => {
      client.emit('message', {
        event: WS_SERVER_EVENTS.TESTER_SCENARIO_PREPARE_DATA_START,
        payload: { symbol: payload.symbol },
      });
    });
  }

  @OnEvent('client.notification')
  async sendClientNotification(payload: { accountId: string; message: string; type: string }) {
    const connection = this.connectionService.getUserConnections(payload.accountId);
    connection.socketClients.forEach((client) => {
      client.emit('message', {
        event: WS_SERVER_EVENTS.CLIENT_NOTIFICATION,
        payload,
      });
    });
  }

  @OnEvent('client.prepare-tester-source-end')
  async prepareTesterSourceEnd(accountId: string) {
    const connection = this.connectionService.getUserConnections(accountId);
    connection.socketClients.forEach((client) => {
      client.emit('message', {
        event: WS_SERVER_EVENTS.TESTER_SCENARIO_PREPARE_DATA_END,
        payload: null,
      });
    });
  }

  @OnEvent('process.force-stop')
  async forceProcessStop({ id, accountId }) {
    await this.scriptService.stop(id, true);
    const userConnections = this.connectionService.getUserConnections(accountId);
    await Promise.all(
      userConnections?.socketClients.map(async (client) => {
        client.emit('message', await this.processMessage(client, WS_CLIENT_EVENTS.BACKGROUND_JOBS_LIST_REQUEST));
      }),
    );
  }

  @OnEvent('client.fatal-error-event')
  async fatalError() {}

  @OnEvent('client.tester-performance')
  sendPerformanceLog({ accountId, log }) {
    // TODO: криво работает с мульти акк!!!
    const userConnections = this.connectionService.getUserConnections(accountId);
    userConnections?.socketClients.forEach((client) => {
      client.emit('message', { event: WS_SERVER_EVENTS.TESTER_SCENARIO_EXEC_INFO, payload: log });
    });
  }

  @OnEvent('client.log')
  sendProcessLogs({ accountId, processId, artifacts, level, message }) {
    const messageArgs = {
      event: `user-script-log`,
      payload: {
        log: { level, time: Date.now(), msg: message },
        processId,
        artifacts,
      },
    };
    if (!accountId) {
      this.server.emit('message', messageArgs);
    }

    const userConnections = this.connectionService.getUserConnections(accountId);
    userConnections?.socketClients.forEach((client) => {
      client.emit('message', messageArgs);
    });
  }

  @OnEvent('client.update-report')
  async updateReport(artifacts: string): Promise<void> {
    this.server.emit('message', {
      event: WS_SERVER_EVENTS.UPDATE_REPORT,
      payload: {
        artifacts,
      },
    });
  }

  @OnEvent('client.update-tester-scenario-list')
  async updateTesterScenarioList(): Promise<void> {
    const userConnections = this.connectionService.getAllConnections();

    userConnections.forEach((connections) => {
      connections.socketClients.forEach(async (client) => {
        client.emit('message', await this.processMessage(client, WS_CLIENT_EVENTS.TESTER_SCENARIO_LIST_REQUEST));
      });
    });

    // if (!userConnections) {
    //   this.logger.warn({ accountId }, 'updateTesterScenarioList: user connection not found');
    //   return;
    // }
    //
    // userConnections.socketClients.forEach((client) => {
    //   client.emit('message', this.processMessage(client, WS_CLIENT_EVENTS.TESTER_SCENARIO_LIST_REQUEST));
    // });
  }

  @OnEvent('client.update-background-jobs-list')
  async updateBackgroundJobsList(): Promise<void> {
    const userConnections = this.connectionService.getAllConnections();

    userConnections.forEach((connections) => {
      connections.socketClients.forEach(async (client) => {
        client.emit('message', await this.processMessage(client, WS_CLIENT_EVENTS.TESTER_SCENARIO_LIST_REQUEST));
      });
    });

    // if (!userConnections) {
    //   this.logger.warn({ accountId }, 'updateBackgroundJobsList: user connection not found');
    //   return;
    // }
    //
    // userConnections.socketClients.forEach((client) => {
    //   client.emit('message', this.processMessage(client, WS_CLIENT_EVENTS.BACKGROUND_JOBS_LIST_REQUEST));
    // });
  }

  @OnEvent('system.update-report')
  async updateSystemReport(): Promise<void> {
    await this.monitoringService.run();
  }

  private processMessage = async (
    client: SocketClient,
    event: WS_CLIENT_EVENTS,
    payload?: WS_CLIENT_EVENT_PAYLOAD[WS_CLIENT_EVENTS],
  ) => {
    if (!client?.user?.id) {
      await this.handleConnection(client);
    }

    switch (event) {
      case WS_CLIENT_EVENTS.LOGIN: {
        try {
          const { email, password } = payload as WS_CLIENT_EVENT_PAYLOAD[WS_CLIENT_EVENTS.LOGIN];
          const data = await this.siteApi.login(email, password);

          return {
            event: WS_SERVER_EVENTS.LOGIN_RESPONSE,
            payload: {
              error: false,
              accessToken: data.accessToken,
            },
          };
        } catch (e) {
          return {
            event: WS_SERVER_EVENTS.LOGIN_RESPONSE,
            payload: { error: true, accessToken: null, message: e.response?.data?.message ?? '' },
          };
        }
      }
      case WS_CLIENT_EVENTS.ENGINE_CONFIG_REQUEST: {
        const json = JSON.parse(fs.readFileSync('./package.json').toString());
        return {
          event: WS_SERVER_EVENTS.ENGINE_CONFIG_RESPONSE,
          payload: {
            version: json.version,
            s3Host: process.env.S3_CLIENT_HOST,
            testerDefaults: TESTER_SCENARIO_DEFAULTS,
          },
        };
      }
      case WS_CLIENT_EVENTS.BACKGROUND_JOBS_LIST_REQUEST: {
        return {
          event: WS_SERVER_EVENTS.BACKGROUND_JOBS_LIST_RESPONSE,
          payload: await this.scriptService.getRuntimeList(client.user.id),
        };
      }
      case WS_CLIENT_EVENTS.STRATEGY_LIST_REQUEST: {
        return {
          event: WS_SERVER_EVENTS.STRATEGY_LIST_RESPONSE,
          payload: this.scriptService.getStrategiesList(),
        };
      }
      case WS_CLIENT_EVENTS.REMOTE_STRATEGY_LIST_REQUEST: {
        try {
          const bundles = await this.scriptService.getRemoteBundles(client.user.id);

          return {
            event: WS_SERVER_EVENTS.REMOTE_STRATEGY_LIST_RESPONSE,
            payload: bundles,
          };
        } catch (e) {
          this.logger.error({ message: e.message }, 'Remote strategy request error');
        }

        return {
          event: WS_SERVER_EVENTS.REMOTE_STRATEGY_LIST_RESPONSE,
          payload: { bundles: [], appBundles: [] },
        };
      }
      case WS_CLIENT_EVENTS.STRATEGY_CONTENT_REQUEST: {
        try {
          const data = payload as WS_CLIENT_EVENT_PAYLOAD[WS_CLIENT_EVENTS.STRATEGY_CONTENT_REQUEST];
          return {
            event: WS_SERVER_EVENTS.STRATEGY_CONTENT_RESPONSE,
            payload: this.scriptService.getStrategyContent(data),
          };
        } catch (e) {
          return {
            event: WS_SERVER_EVENTS.STRATEGY_CONTENT_RESPONSE,
            payload: null,
          };
        }
      }
      case WS_CLIENT_EVENTS.CODE_EDITOR_FILE_SAVE_REQUEST: {
        const data = payload as WS_CLIENT_EVENT_PAYLOAD[WS_CLIENT_EVENTS.CODE_EDITOR_FILE_SAVE_REQUEST];
        this.scriptService.saveStrategy(data.filePath, data.content);

        return {
          event: WS_SERVER_EVENTS.CODE_EDITOR_FILE_SAVE_RESPONSE,
          payload: {
            error: false,
          },
        };
      }
      case WS_CLIENT_EVENTS.CODE_EDITOR_FILE_REMOVE_REQUEST: {
        const data = payload as WS_CLIENT_EVENT_PAYLOAD[WS_CLIENT_EVENTS.CODE_EDITOR_FILE_REMOVE_REQUEST];
        this.scriptService.removeStrategy(data);
        break;
      }
      case WS_CLIENT_EVENTS.CODE_EDITOR_FILE_RENAME_REQUEST: {
        const data = payload as WS_CLIENT_EVENT_PAYLOAD[WS_CLIENT_EVENTS.CODE_EDITOR_FILE_RENAME_REQUEST];
        this.scriptService.renameStrategy(data.oldPath, data.newPath, data.content);

        return {
          event: WS_SERVER_EVENTS.CODE_EDITOR_FILE_RENAME_RESPONSE,
          payload: {
            error: false,
          },
        };
      }
      case WS_CLIENT_EVENTS.CODE_EDITOR_FILE_TREE_REQUEST: {
        return {
          event: WS_SERVER_EVENTS.CODE_EDITOR_FILE_TREE_RESPONSE,
          payload: this.scriptService.getSourceFileTree(),
        };
      }
      case WS_CLIENT_EVENTS.CODE_EDITOR_FILE_CONTENT_REQUEST: {
        const data = payload as WS_CLIENT_EVENT_PAYLOAD[WS_CLIENT_EVENTS.CODE_EDITOR_FILE_CONTENT_REQUEST];
        return {
          event: WS_SERVER_EVENTS.CODE_EDITOR_FILE_CONTENT_RESPONSE,
          payload: this.scriptService.getFileTreeStrategyContent(data),
        };
      }
      case WS_CLIENT_EVENTS.REBOOT_SYSTEM_REQUEST: {
        process.emit('SIGINT');
      }
      case WS_CLIENT_EVENTS.REMOVE_BACKGROUND_JOB_REQUEST: {
        const data = payload as WS_CLIENT_EVENT_PAYLOAD[WS_CLIENT_EVENTS.REMOVE_BACKGROUND_JOB_REQUEST];
        await this.scriptService.removeRuntime(data);
        return await this.processMessage(client, WS_CLIENT_EVENTS.BACKGROUND_JOBS_LIST_REQUEST, null);
      }
      case WS_CLIENT_EVENTS.RUN_BACKGROUND_JOB_REQUEST: {
        const data = payload as WS_CLIENT_EVENT_PAYLOAD[WS_CLIENT_EVENTS.RUN_BACKGROUND_JOB_REQUEST];
        await this.scriptService.run(data);
        return await this.processMessage(client, WS_CLIENT_EVENTS.BACKGROUND_JOBS_LIST_REQUEST, null);
      }
      case WS_CLIENT_EVENTS.STOP_BACKGROUND_JOB_REQUEST: {
        const data = payload as WS_CLIENT_EVENT_PAYLOAD[WS_CLIENT_EVENTS.STOP_BACKGROUND_JOB_REQUEST];
        await this.scriptService.stop(data, true);
        return await this.processMessage(client, WS_CLIENT_EVENTS.BACKGROUND_JOBS_LIST_REQUEST, null);
      }
      case WS_CLIENT_EVENTS.SAVE_BACKGROUND_JOB_REQUEST: {
        const data = payload as WS_CLIENT_EVENT_PAYLOAD[WS_CLIENT_EVENTS.SAVE_BACKGROUND_JOB_REQUEST];

        if ('id' in data) {
          await this.scriptService.updateRuntime(
            client.user.id,
            data.id,
            data.name,
            data.prefix,
            data.strategy,
            data.args,
            data.runtimeType,
            data.exchange,
          );
        } else {
          await this.scriptService.addRuntime(
            client.user.id,
            data.name,
            data.prefix,
            data.strategy,
            data.args,
            data.runtimeType,
            data.exchange,
          );
        }
        return await this.processMessage(client, WS_CLIENT_EVENTS.BACKGROUND_JOBS_LIST_REQUEST, null);
      }
      case WS_CLIENT_EVENTS.TESTER_SCENARIO_LIST_REQUEST: {
        return {
          event: WS_SERVER_EVENTS.TESTER_SCENARIO_LIST_RESPONSE,
          payload: await this.scenarioService.findAll(client.user.id),
        };
      }
      case WS_CLIENT_EVENTS.CREATE_TESTER_SCENARIO: {
        const data = payload as WS_CLIENT_EVENT_PAYLOAD[WS_CLIENT_EVENTS.CREATE_TESTER_SCENARIO];
        await this.scenarioService.compileAndSave({ accountId: client.user.id, ...data });
        return await this.processMessage(client, WS_CLIENT_EVENTS.TESTER_SCENARIO_LIST_REQUEST, null);
      }
      case WS_CLIENT_EVENTS.RUN_TESTER_SCENARIO: {
        const data = payload as WS_CLIENT_EVENT_PAYLOAD[WS_CLIENT_EVENTS.RUN_TESTER_SCENARIO];
        await this.testerService.runScenarioInChild(data, false);
        break;
      }
      case WS_CLIENT_EVENTS.RUN_TESTER_SCENARIO_SYNC: {
        const data = payload as WS_CLIENT_EVENT_PAYLOAD[WS_CLIENT_EVENTS.RUN_TESTER_SCENARIO_SYNC];
        await this.testerService.runScenarioInChild(data, true);
        break;
      }
      case WS_CLIENT_EVENTS.STOP_ALL_TESTER_SCENARIO: {
        this.testerService.stopAllProcesses(client.user.id);
        break;
      }
      case WS_CLIENT_EVENTS.REMOVE_TESTER_SCENARIO: {
        const data = payload as WS_CLIENT_EVENT_PAYLOAD[WS_CLIENT_EVENTS.REMOVE_TESTER_SCENARIO];
        this.testerService.stopAllProcesses(client.user.id);
        await this.scenarioService.removeScenario(data);
        return await this.processMessage(client, WS_CLIENT_EVENTS.TESTER_SCENARIO_LIST_REQUEST, null);
      }
      case WS_CLIENT_EVENTS.ARTIFACTS_REQUEST: {
        const data = payload as WS_CLIENT_EVENT_PAYLOAD[WS_CLIENT_EVENTS.ARTIFACTS_REQUEST];
        return {
          event: WS_SERVER_EVENTS.ARTIFACTS_RESPONSE,
          payload: {
            artifacts: payload,
            data: this.scriptArtifactService.read(data),
          },
        };
      }
      case WS_CLIENT_EVENTS.LOGS_LIST_REQUEST: {
        const data = payload as WS_CLIENT_EVENT_PAYLOAD[WS_CLIENT_EVENTS.LOGS_LIST_REQUEST];
        return {
          event: WS_SERVER_EVENTS.LOGS_LIST_RESPONSE,
          payload: {
            artifacts: payload,
            data: this.scriptLogsService.read(data),
          },
        };
      }
      case WS_CLIENT_EVENTS.TESTER_HISTORICAL_BARS_REQUEST: {
        const { requestId, symbol, timeframe, date } =
          payload as WS_CLIENT_EVENT_PAYLOAD[WS_CLIENT_EVENTS.TESTER_HISTORICAL_BARS_REQUEST];

        let result = null;

        try {
          result = await this.historyBarsService.downloadZip(symbol, timeframe, new Date(date));
        } catch (e) {
          console.error(e);
        }

        return {
          event: WS_SERVER_EVENTS.TESTER_HISTORICAL_BARS_RESPONSE,
          payload: {
            requestId,
            symbol,
            timeframe,
            data: result,
          },
        };
      }
      case WS_CLIENT_EVENTS.RUNTIME_HISTORICAL_BARS_REQUEST: {
        const data = payload as WS_CLIENT_EVENT_PAYLOAD[WS_CLIENT_EVENTS.RUNTIME_HISTORICAL_BARS_REQUEST];
        try {
          const exchange = this.ccxtService.getSDK(data.exchange, { apiKey: '', secret: '', password: '' });
          const ohlcv = await exchange.fetchOHLCV(data.symbol, data.timeframe.toString(), data.startTime, data.limit);
          const bars = ohlcv.map(([time, open, high, low, close, volume]) => ({
            time,
            open,
            high,
            low,
            close,
            volume,
          }));

          return {
            event: WS_SERVER_EVENTS.RUNTIME_HISTORICAL_BARS_RESPONSE,
            payload: {
              requestId: data.requestId,
              symbol: data.symbol,
              timeframe: data.timeframe,
              data: bars,
            },
          };
        } catch (e) {
          this.logger.error(e);
          return {
            event: WS_SERVER_EVENTS.TESTER_HISTORICAL_BARS_RESPONSE,
            payload: {
              requestId: data.requestId,
              symbol: data.symbol,
              timeframe: data.timeframe,
              data: [],
            },
          };
        }
      }
      case WS_CLIENT_EVENTS.SUBSCRIBE_REALTIME_TICKER_REQUEST: {
        const data = payload as WS_CLIENT_EVENT_PAYLOAD[WS_CLIENT_EVENTS.SUBSCRIBE_REALTIME_TICKER_REQUEST];
        const subId = this.dataFeedFactory.subscribeTicker(data.exchange, data.symbol, (ticker: Ticker) => {
          client.emit('message', {
            event: WS_SERVER_EVENTS.REALTIME_TICKER,
            payload: {
              ...data,
              ticker,
            },
          });
        });

        this.connectionService.addExchangeTickerSubscriber(client.user.id, {
          exchange: data.exchange,
          symbol: data.symbol,
          datafeedSubId: subId,
          clientListenerId: data.listenerId,
        });

        return {
          event: WS_SERVER_EVENTS.SUBSCRIBE_REALTIME_TICKER_RESPONSE,
          payload: {
            error: false,
            subId,
          },
        };
      }
      case WS_CLIENT_EVENTS.UNSUBSCRIBE_REALTIME_TICKER_REQUEST: {
        const { listenerId } = payload as WS_CLIENT_EVENT_PAYLOAD[WS_CLIENT_EVENTS.UNSUBSCRIBE_REALTIME_TICKER_REQUEST];

        const userConnections = this.connectionService.getUserConnections(client.user.id);
        const subscribe = userConnections?.exchangeTickerSubscribes.find((sub) => sub.clientListenerId === listenerId);

        if (!subscribe) return;

        this.dataFeedFactory.unsubscribeTicker(subscribe.exchange, subscribe.symbol, subscribe.datafeedSubId);
        this.connectionService.removeExchangeTickerSubscriber(client.user.id, subscribe.datafeedSubId);

        return {
          event: WS_SERVER_EVENTS.UNSUBSCRIBE_REALTIME_TICKER_RESPONSE,
          payload: listenerId,
        };
      }
      case WS_CLIENT_EVENTS.EXCHANGE_CONFIG_REQUEST: {
        return {
          event: WS_SERVER_EVENTS.EXCHANGE_CONFIG_RESPONSE,
          payload: {
            exchanges: await this.exchangeConnectorService.getExchangeList(client.user.id),
          },
        };
      }
      case WS_CLIENT_EVENTS.EXCHANGE_CONFIG_SAVE: {
        const data = payload as WS_CLIENT_EVENT_PAYLOAD[WS_CLIENT_EVENTS.EXCHANGE_CONFIG_SAVE];
        await this.exchangeConnectorService.updateExchangeConfig(client.user.id, data);
        return this.processMessage(client, WS_CLIENT_EVENTS.EXCHANGE_CONFIG_REQUEST);
      }
      case WS_CLIENT_EVENTS.PULL_USER_SOURCE_CODE_REQUEST: {
        let payload = { error: true, message: 'Update failed' };
        try {
          execSync('cd ./jtl-infra-public; git reset HEAD^ --hard; git pull;');
          payload.error = false;
          payload.message = 'Success update';
        } catch (e) {
          this.logger.error(e.toString());
        }
        return {
          event: WS_SERVER_EVENTS.PULL_USER_SOURCE_CODE_RESPONSE,
          payload,
        };
      }
      case WS_CLIENT_EVENTS.CODE_EDITOR_BUILD_BUNDLE_REQUEST: {
        try {
          await this.scriptBundlerService.buildAndSaveToStore(
            (payload as WS_CLIENT_EVENT_PAYLOAD[WS_CLIENT_EVENTS.CODE_EDITOR_BUILD_BUNDLE_REQUEST]).filePath,
            client.user.id,
          );

          return {
            event: WS_SERVER_EVENTS.CODE_EDITOR_BUILD_BUNDLE_RESPONSE,
            payload: {
              error: false,
            },
          };
        } catch (e) {
          this.logger.error(e);
          let responseMessage: string;

          if (e instanceof AxiosError) {
            responseMessage = e.response.data.message;
          }

          return {
            event: WS_SERVER_EVENTS.CODE_EDITOR_BUILD_BUNDLE_RESPONSE,
            payload: {
              error: true,
              message: responseMessage,
            },
          };
        }
      }
      case WS_CLIENT_EVENTS.REPORT_ACTION_REQUEST: {
        const data = payload as WS_CLIENT_EVENT_PAYLOAD[WS_CLIENT_EVENTS.REPORT_ACTION_REQUEST];
        const response = {
          event: WS_SERVER_EVENTS.REPORT_ACTION_RESPONSE,
          payload: {
            requestId: data.requestId,
            error: false,
            message: '',
          },
        };

        if (data.artifacts === 'system') {
          switch (data.action) {
            case 'force-system-report-update': {
              await this.updateSystemReport();
              response.payload.message = 'Proxy SUCCESS Report update';
              break;
            }
            case 'validate-proxy': {
              const ipData = await this.monitoringService.checkProxy();
              const ip = ipData[0]?.ip;
              response.payload.message = `Proxy SUCCESS. IP: ${ip}`;
              break;
            }
          }
          return response;
        }

        await this.scriptService.submitReportAction(client.user.id, data.artifacts, data.action, data.payload);
        response.payload.message = 'Action sent successfully';
        return response;
      }

      case WS_CLIENT_EVENTS.INVALIDATE_CACHE_REQUEST: {
        await this.accountService.invalidateCache();
        return {
          event: WS_SERVER_EVENTS.INVALIDATE_CACHE_RESPONSE,
        };
      }

      case WS_CLIENT_EVENTS.EXCHANGE_MARKETS_REQUEST: {
        const exchange = payload as WS_CLIENT_EVENT_PAYLOAD[WS_CLIENT_EVENTS.EXCHANGE_MARKETS_REQUEST];
        const data = await this.ccxtService.getExchangeMarkets(exchange);
        return {
          event: WS_SERVER_EVENTS.EXCHANGE_MARKETS_RESPONSE,
          payload: {
            exchange,
            data,
          },
        };
      }

      default: {
        this.logger.info({ event }, 'Unknown event');
      }
    }
  };
}
