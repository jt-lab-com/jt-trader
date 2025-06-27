import { Injectable } from '@nestjs/common';
import { CacheService } from '../../common/cache/cache.service';
import { ACCOUNT_PARAMS_LIST, DEFAULT_VALUES } from './const';
import { AccountParamType } from './types';

@Injectable()
export class AccountService {
  constructor(private readonly cacheService: CacheService) {}

  public async getParamsList(accountId: string): Promise<AccountParamType[]> {
    return JSON.parse(await this.cacheService.get(`${ACCOUNT_PARAMS_LIST}_${accountId}`)) as AccountParamType[];
  }

  public async getParam(accountId: string, paramKey: string): Promise<string> {
    const param = (await this.getParamsList(accountId))?.find(({ key }) => key === paramKey)?.value;
    return param ?? DEFAULT_VALUES[paramKey];
  }

  public async updateParamsList(accountId: string, list: AccountParamType[]): Promise<void> {
    await this.cacheService.set(`${ACCOUNT_PARAMS_LIST}_${accountId}`, JSON.stringify(list));
  }

  public async invalidateCache() {
    await this.cacheService.deleteAllHostKeys();
  }
}
