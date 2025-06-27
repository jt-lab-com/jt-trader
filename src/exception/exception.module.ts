import { Module } from '@nestjs/common';
import { MainProcessExceptionHandler } from './main-process-exception.handler';
import { EnvironmentModule } from '../environment/environment.module';
import { ConsoleProcessExceptionHandler } from './console-process-exception.handler';

@Module({
  imports: [EnvironmentModule],
  providers: [
    {
      provide: MainProcessExceptionHandler,
      useClass:
        ['tester', 'tester-sync'].indexOf(process.env.NODE_ENV) > -1
          ? ConsoleProcessExceptionHandler
          : MainProcessExceptionHandler,
    },
  ],
  exports: [MainProcessExceptionHandler],
})
export class ExceptionModule {}
