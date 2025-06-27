import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { CacheService } from '../common/cache/cache.service';
import { DataSourceService } from './data-source/data-source.service';
import { EnvironmentModule } from '../environment/environment.module';
import { DataFeedFactory } from '../environment/data-feed/data-feed.factory';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [LoggerModule.forRoot({}), CommonModule, EnvironmentModule],
  providers: [CacheService, DataSourceService, DataFeedFactory],
})
export class DataProxyModule {}
