import { ScriptScenarioService } from './script-scenario.service';
import { ScenarioInterface, ScriptScenarioStorageService } from '../storage/script-scenario-storage.service';
import { ScriptArtifactsService } from '../artifacts/script-artifacts.service';
import { AccountService } from '../../account/account.service';
import { PinoLogger } from 'nestjs-pino';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('ScriptScenarioService', () => {
  const logger = { warn: jest.fn() } as unknown as PinoLogger;
  const storageService: ScriptScenarioStorageService = {
    async getScenario(id: number): Promise<ScenarioInterface> {
      return Promise.resolve({} as ScenarioInterface);
    },
  } as ScriptScenarioStorageService;
  const artifactsService: ScriptArtifactsService = new ScriptArtifactsService(new EventEmitter2(), logger);
  const accountService: AccountService = {} as AccountService;

  const service: ScriptScenarioService = new ScriptScenarioService(
    storageService,
    artifactsService,
    accountService,
    logger,
  );
  const scenarioId = 999;

  it('UpdateScenarioReport success', async () => {
    jest.spyOn(storageService, 'getScenario').mockImplementation((id): Promise<ScenarioInterface> => {
      expect(id).toEqual(scenarioId);
      return Promise.resolve({
        sets: [
          // { artifacts: '1c7155d23d6ace186cd8a4b10f828ced' },
          // { artifacts: '2e690d221871b9c0eb1d389ce76d13a0' },
          // { artifacts: 'f21cdd245a3f135c42c0c9121e70058e' },
          { artifacts: 'd02f0321903ccae25c6c0c3130ad6213' },
          { artifacts: 'd676d12b3033b15ca4397c58dd31d460' },
          { artifacts: '395e890c5aca33563718c4b805e4e4d1' },
          { artifacts: '67d0da2ecb78274bc5a204fbeb8273bc' },
          { artifacts: '87e7e62293a781325389f37fc15ff85e' },
        ],
        artifacts: 'scenario-update-test',
      } as ScenarioInterface);
    });

    await service.updateScenarioReport(scenarioId);
    expect(scenarioId).toEqual(scenarioId);
  });
});
