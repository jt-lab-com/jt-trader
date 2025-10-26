import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ScriptLogsService {
  private readonly filePath: string;

  constructor(@InjectPinoLogger(ScriptLogsService.name) private readonly logger: PinoLogger) {
    this.filePath = process.env.LOGS_DIR_PATH;
  }

  read(key: string) {
    const fileName = path.join(this.filePath, `${key}.log`);
    if (!fs.existsSync(fileName)) {
      fs.writeFileSync(fileName, '', { encoding: 'utf8' });
    }
    try {
      const raw = fs.readFileSync(fileName, { encoding: 'utf8' });

      return raw
        .split('\n')
        .map((line) => (line.length ? JSON.parse(line) : null))
        .filter(Boolean)
        .map(({ level, ...rest }) => ({ level: this._getLogLevel(level), ...rest }));
    } catch (e) {
      this.logger.warn({ key, stack: e.stack, message: e.message }, 'Could not read logs');
    }
  }

  private _getLogLevel(level: number) {
    switch (level) {
      case 20:
        return 'debug';
      case 30:
        return 'info';
      case 40:
        return 'warn';
      case 50:
        return 'error';
      default:
        return 'info';
    }
  }
}
