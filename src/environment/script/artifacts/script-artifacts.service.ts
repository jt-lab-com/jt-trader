import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ScriptArtifactsService {
  private readonly filePath: string;

  static createArtifactsKey(arrayParams: any[]) {
    return crypto.createHash('md5').update(arrayParams.join('::')).digest('hex');
  }

  private static format(artifacts: any) {
    // TODO: common formatter
    return artifacts;
  }

  constructor(
    private readonly eventEmitter: EventEmitter2,
    @InjectPinoLogger(ScriptArtifactsService.name) private readonly logger: PinoLogger,
  ) {
    this.filePath = process.env.ARTIFACTS_DIR_PATH;
  }

  save(key: string, artifacts: any) {
    if (!fs.existsSync(this.filePath)) fs.mkdirSync(this.filePath);
    fs.writeFileSync(path.join(this.filePath, `${key}.json`), JSON.stringify(ScriptArtifactsService.format(artifacts)));
    this.eventEmitter.emit('client.update-report', key);
  }

  read(key: string): any {
    const fileName = path.join(this.filePath, `${key}.json`);
    // if (!fs.existsSync(fileName)) {
    //   fs.writeFileSync(fileName, '{}', { encoding: 'utf8' });
    // }

    try {
      const json = fs.readFileSync(fileName, { encoding: 'utf8' }).toString();
      return JSON.parse(json);
    } catch (e) {
      this.logger.warn({ key, stack: e.stack?.split('\n'), message: e.message }, 'Could not read report');
    }
  }
}
