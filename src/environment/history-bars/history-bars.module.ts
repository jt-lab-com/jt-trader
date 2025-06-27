import { Module } from '@nestjs/common';
import { HistoryBarsService } from './history-bars.service';
import { S3Source } from './sources/s3';
import { BinanceSource } from './sources/binance';
import { GateIoSource } from './sources/gate-io';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [HistoryBarsService, S3Source, BinanceSource, GateIoSource],
  exports: [HistoryBarsService],
})
export class HistoryBarsModule {}
