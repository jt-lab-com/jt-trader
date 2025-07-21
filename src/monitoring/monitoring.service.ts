import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { DataFeedFactory } from '../environment/data-feed/data-feed.factory';
import { ScriptArtifactsService } from '../environment/script/artifacts/script-artifacts.service';
import axios from 'axios';
import { SocksProxyAgent } from 'socks-proxy-agent';

@Injectable()
export class MonitoringService {
  constructor(
    @InjectPinoLogger(MonitoringService.name) private readonly logger: PinoLogger,
    private readonly dataFeedFactory: DataFeedFactory,
    private readonly artifactsService: ScriptArtifactsService,
  ) {
    const checker = async () => {
      await this.run();
      setTimeout(checker, 5 * 60 * 1000);
    };
    checker().finally();
  }

  public async run() {
    const report = {};

    report[DataFeedFactory.name] = this.dataFeedFactory.statusReport();
    report['Proxy'] = await this.checkProxy();

    this.logger.info(report, 'App STATUS');
    this.artifactsService.save('system', this.formatReport(report));
  }

  public async checkProxy() {
    const logData = [];
    for (const url of ['https://icanhazip.com', 'https://ipinfo.io/ip']) {
      try {
        const { data } = await axios({
          method: 'GET',
          httpsAgent: !!process.env.CCXT_PROXY ? new SocksProxyAgent(process.env.CCXT_PROXY) : undefined,
          url,
        });
        logData.push({ url, ip: data.trim() });
      } catch (e) {
        this.logger.warn({ url, error: e.toString(), proxy: process.env.CCXT_PROXY }, `Failed Proxy check request`);
      }
    }

    return logData;
  }

  private formatReport(data: object): object {
    const result = [];

    result.push(
      {
        type: 'text',
        isVisible: true,
        data: {
          value: 'System status report',
          variant: 'h3',
          align: 'center',
        },
      },
      {
        type: 'action_button',
        isVisible: true,
        data: {
          label: 'Update Report',
          action: 'force-system-report-update',
          payload: '',
        },
      },
      {
        type: 'action_button',
        isVisible: true,
        data: {
          label: 'Check Proxy Connection',
          action: 'validate-proxy',
          payload: '',
        },
      },
    );

    Object.entries(data).forEach(([key, value]) => {
      switch (key) {
        case DataFeedFactory.name:
        default: {
          result.push({
            type: 'table',
            name: key,
            isVisible: true,
            data: value,
          });
          break;
        }
      }
    });

    return { id: 'system', symbol: '', blocks: result };
  }
}
