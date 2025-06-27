import { Module } from '@nestjs/common';
import { EnvironmentModule } from '../environment/environment.module';
import { CommonModule } from '../common/common.module';
import { MonitoringService } from './monitoring.service';

@Module({
  imports: [EnvironmentModule, CommonModule],
  providers: [MonitoringService],
  exports: [MonitoringService],
})
export class MonitoringModule {}
