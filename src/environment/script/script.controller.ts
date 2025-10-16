import { Controller, Get, HttpException, HttpStatus, Request, Param, Query } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ScriptService } from './script.service';
import { SiteApi } from '../../common/api/site-api';
import { StrategyItem } from './types';
import { nanoid } from 'nanoid';
import { EXCHANGE_LIST } from '@packages/const/exchanges';

@Controller()
export class ScriptController {
  constructor(
    private readonly scriptService: ScriptService,
    private readonly siteApi: SiteApi,
    @InjectPinoLogger(ScriptController.name) private readonly logger: PinoLogger,
  ) {}

  @Get('/remote/create-runtime/:type/:appId')
  async createRuntimeRemote(
    @Request() req: Request,
    @Param('type') strategyType: 'app' | 'bundle',
    @Param('appId') appId: string,
    @Query('auth') token: string,
    @Query('exchange') exchangeQuery?: string,
  ) {
    const forbiddenError: HttpException = new HttpException('FORBIDDEN', HttpStatus.FORBIDDEN);

    if (!token) throw new HttpException('FORBIDDEN', HttpStatus.FORBIDDEN);

    const strategy: StrategyItem = {
      id: appId,
      type: strategyType,
      name: '',
      mode: 'runtime',
    };

    try {
      const { auth } = await this.siteApi.authUser(token, req.headers['host']);
      const appData = await this.siteApi.getBundle(strategy, auth.id);

      const exchangeCode = exchangeQuery
        ? EXCHANGE_LIST.find((exchange) => exchange.code === exchangeQuery)?.code ?? 'binanceusdm'
        : 'binanceusdm';

      const runtimeId = await this.scriptService.addRuntime(
        auth.id.toString(),
        appData.name,
        nanoid(8),
        {
          ...strategy,
          name: appData.name,
        },
        appData.defined_args
          ?.filter(({ key, mode }) => mode === 'runtime' || !mode)
          ?.map(({ key, defaultValue, options }) => ({
            key,
            value: defaultValue,
            ...(!!options && { options }),
          })) ?? [],
        'market',
        exchangeCode,
        'swap',
      );

      return { runtimeId };
    } catch (e) {
      this.logger.error({ stack: e.stack?.split('\n'), message: e.message }, 'Runtime remote create error');
      throw forbiddenError;
    }
  }
}
