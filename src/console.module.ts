import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import * as path from 'path';
import { CsvModule } from 'nest-csv-parser';
import { EnvironmentModule } from './environment/environment.module';
import * as process from 'process';
import { ExceptionModule } from "./exception/exception.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        redact: {
          paths: ['pid', 'hostname', 'context'],
          remove: true,
        },
        hooks: {
          logMethod(args, method, level) {
            if (['InstanceLoader', 'NestFactory'].indexOf(args[0]?.['context']) > -1) return;
            method.apply(this, args);
          },
        },
        transport: {
          targets: [
            {
              level: 'debug',
              target: 'pino-pretty',
              options: { colorize: true },
            },
            {
              level: 'info',
              target: 'pino/file',
              options: {
                destination: path.join(process.env.LOGS_DIR_PATH, `${process.env.TESTER_OPTIMIZE_ARTIFACTS}.log`),
                sync: false,
                append: false,
              },
            },
          ],
        },
      },
    }),
    CsvModule,
    EnvironmentModule,
    ExceptionModule
  ],
})
export class AppModule {}
