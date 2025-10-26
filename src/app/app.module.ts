import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EnvironmentModule } from '../environment/environment.module';
import { CsvModule } from 'nest-csv-parser';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { EventsModule } from '../events/events.module';
import { ExceptionModule } from '../exception/exception.module';
import * as path from 'path';
import { rotator } from 'logrotator';
import * as fs from 'fs';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', '..', 'client', 'dist'),
    }),
    LoggerModule.forRootAsync({
      useFactory: () => {
        if (!fs.existsSync(process.env.LOGS_DIR_PATH)) {
          fs.mkdirSync(process.env.LOGS_DIR_PATH);
        }

        return {
          forRoutes: [],
          renameContext: 'class',
          pinoHttp: {
            // crlf: true,
            redact: {
              paths: ['hostname'],
              remove: true,
            },
            hooks: {
              logMethod(args, method, level) {
                if (['InstanceLoader', 'NestFactory'].indexOf(args[0]?.['context']) > -1) return;
                if (!!process.env.APP_NAME && !!args[0]?.['class']) args[0]['appname'] = process.env.APP_NAME;
                method.apply(this, args);
              },
            },
            transport: {
              targets: [
                {
                  level: 'info',
                  target: 'pino/file',
                  options: {
                    destination: path.join(process.env.LOGS_DIR_PATH, `system.log`),
                    sync: false,
                    append: true,
                    // size: '1000B',
                    // interval: '5s',
                    // compress: 'gzip',
                  },
                },
                {
                  level: 'debug',
                  target: process.env.ENV === 'production' ? 'pino/file' : 'pino-pretty',
                  options: { destination: 2, colorize: true },
                },
              ],
            },
          },
        };
      },
    }),
    CsvModule,
    EnvironmentModule,
    EventsModule,
    ExceptionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor() {
    rotator.register(path.join(process.env.LOGS_DIR_PATH, `system.log`), {
      schedule: '2m',
      size: '3m',
      compress: false,
      count: 10,
    });
    rotator.on('error', (err) => {
      console.log('oops, an error occured!', err);
    });
    rotator.on('rotate', (file) => {
      console.log('file ' + file + ' was rotated!');
    });
  }
}
