import { Controller, Get, HttpException, HttpStatus, Request, Param, Query } from '@nestjs/common';
import { SiteApi } from '../../common/api/site-api';
import { ScenarioDTO, ScriptScenarioService } from '../script/scenario/script-scenario.service';
import { TESTER_DEFAULT_SYMBOLS, TESTER_SCENARIO_DEFAULTS } from '../account/const';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Controller()
export class ScriptTesterController {
  constructor(
    private readonly scriptScenarioService: ScriptScenarioService,
    private readonly siteApi: SiteApi,
    @InjectPinoLogger(ScriptTesterController.name) private readonly logger: PinoLogger,
  ) {}

  @Get('/remote/create-scenario/:type/:appId')
  async createTesterScenarioRemote(
    @Request() req: Request,
    @Param('type') strategyType: 'app' | 'bundle',
    @Param('appId') appId: string,
    @Query('auth') token: string,
  ) {
    const forbiddenError: HttpException = new HttpException('FORBIDDEN', HttpStatus.FORBIDDEN);
    if (!token) throw new HttpException('FORBIDDEN', HttpStatus.FORBIDDEN);

    try {
      const { auth } = await this.siteApi.authUser(token, req.headers['host']);
      const appData = await this.siteApi.getBundle(
        {
          id: appId,
          type: strategyType,
          name: '',
          mode: 'tester',
        },
        auth.id,
      );

      const existed = (await this.scriptScenarioService.findAll(auth.id.toString()))?.find(
        ({ strategy }) => strategy.name === appData.name,
      );
      if (!!existed) return { scenarioId: existed.id };

      const scenarioDto: ScenarioDTO = {
        strategy: { name: appData.name, id: appId, type: strategyType, version: appData?.version.toString() },
        accountId: auth.id.toString(),
        args:
          appData.defined_args
            ?.filter(({ key, mode }) => (mode === 'tester' || !mode) && key !== TESTER_DEFAULT_SYMBOLS)
            ?.map(({ key, defaultValue, options }) => ({
              key,
              value: defaultValue,
              ...(!!options && { options }),
            })) ?? [],
        name: `Tester# ${appData.name}`,
        scope: [['param', 0, 0, 1]],
        ...TESTER_SCENARIO_DEFAULTS,
      };

      const defSymbols: string = appData.defined_args?.find(
        ({ key, mode }) => key === TESTER_DEFAULT_SYMBOLS && (mode === 'tester' || !mode),
      )?.defaultValue;
      // @ts-ignore
      if (!!defSymbols) scenarioDto[TESTER_DEFAULT_SYMBOLS] = defSymbols.split(',').map((item) => item.trim());

      const scenario = await this.scriptScenarioService.compileAndSave(scenarioDto);

      return { scenarioId: scenario.id };
    } catch (e) {
      this.logger.error({ stack: e.stack?.split('\n'), message: e.message }, 'Scenario remote create error');
      throw forbiddenError;
    }
  }
}
