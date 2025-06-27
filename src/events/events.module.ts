import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { EnvironmentModule } from '../environment/environment.module';
import { CommonModule } from '../common/common.module';
import { ConnectionService } from './connection.service';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { HistoryBarsModule } from '../environment/history-bars/history-bars.module';

@Module({
  imports: [EnvironmentModule, CommonModule, MonitoringModule, HistoryBarsModule],
  providers: [EventsGateway, ConnectionService],
})
export class EventsModule {}
