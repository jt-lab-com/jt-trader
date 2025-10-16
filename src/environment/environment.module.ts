import { Module } from '@nestjs/common';
import { DataFeedFactory } from './data-feed/data-feed.factory';
import { OrderService } from './exchange/order.service';
import { CsvModule } from 'nest-csv-parser';
import { ScriptService } from './script/script.service';
import { ScriptBundlerService } from './script/bundler/script-bundler.service';
import { ScriptProcessFactory } from './script/process/script-process.factory';
import { ScriptStorageService } from './script/storage/script-storage.service';
import { CCXTService } from './exchange/ccxt.service';
import { ScriptExchangeKeysService } from './script/storage/script-exchange-keys.service';
import { CCXTMockAsyncService } from './exchange/ccxt-mock-async.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScriptScenarioService } from './script/scenario/script-scenario.service';
import { ScriptScenarioStorageService } from './script/storage/script-scenario-storage.service';
import { ScriptTesterService } from './script-tester/script-tester.service';
import { ScriptArtifactsService } from './script/artifacts/script-artifacts.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { ConfigService } from './config/config.service';
import { CCXTMockSyncService } from './exchange/ccxt-mock-sync.service';
import { ScriptLogsService } from './script/artifacts/script-logs.service';
import { AccountService } from './account/account.service';
import { ExchangeConnectorService } from './exchange/exchange-connector/exchange-connector.service';
import { CommonModule } from '../common/common.module';
import { ExchangeSdkFactory } from './exchange/ccxt-sdk.factory';
import { ScriptTesterController } from './script-tester/script-tester.controller';
import { ScriptController } from './script/script.controller';
import { AccountController } from './account/account.controller';
import { HistoryBarsModule } from './history-bars/history-bars.module';
import { MarketsService } from './exchange/markets.service';

@Module({
  imports: [CsvModule, EventEmitterModule.forRoot(), CommonModule, HistoryBarsModule],
  providers: [
    DataFeedFactory,
    OrderService,
    {
      provide: CCXTService,
      useClass:
        {
          tester: CCXTMockAsyncService,
          'tester-sync': CCXTMockSyncService,
          production: CCXTService,
        }[process.env.NODE_ENV] ?? CCXTService,
    },
    MarketsService,
    ScriptService,
    ScriptBundlerService,
    ScriptProcessFactory,
    ScriptStorageService,
    ScriptExchangeKeysService,
    ScriptScenarioService,
    ScriptScenarioStorageService,
    ScriptTesterService,
    ScriptArtifactsService,
    ScriptLogsService,
    PrismaService,
    ConfigService,
    ExchangeConnectorService,
    AccountService,
    ExchangeSdkFactory,
  ],
  exports: [
    ScriptService,
    ScriptBundlerService,
    ScriptProcessFactory,
    ScriptStorageService,
    ScriptExchangeKeysService,
    ScriptScenarioService,
    ScriptScenarioStorageService,
    DataFeedFactory,
    OrderService,
    CCXTService,
    MarketsService,
    ScriptTesterService,
    ScriptArtifactsService,
    ScriptLogsService,
    ConfigService,
    ExchangeConnectorService,
    AccountService,
  ],
  controllers: [ScriptTesterController, ScriptController, AccountController],
})
export class EnvironmentModule {}
