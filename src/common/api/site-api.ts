import axios, { AxiosInstance } from 'axios';
import { Injectable } from '@nestjs/common';
import {
  AuthUserResponse,
  UploadBundleRequest,
  UploadBundleResponse,
  StoreBundleResponse,
  UserBundlesResponse,
} from './types';
import { CacheService } from '../cache/cache.service';
import * as FormData from 'form-data';
import { StrategyItem } from '../../environment/script/types';

@Injectable()
export class SiteApi {
  private readonly _api: AxiosInstance;
  private readonly _siteApiHost: string;
  static readonly BUNDLE_CACHE_TIMEOUT = 10 * 60;
  static readonly BUNDLE_CACHE_KEY = 'BUNDLE_CACHE_KEY';
  static readonly USER_TOKEN_CACHE_KEY = 'USER_CACHE_KEY';
  static readonly APP_DOMAIN = '.jtnodes.top';

  constructor(private readonly cacheService: CacheService) {
    this._siteApiHost = process.env.SITE_API_HOST;
    this._api = axios.create({
      baseURL: this._siteApiHost + '/api/external/servers',
      family: 4,
    });
  }

  async login(email: string, password: string): Promise<{ accessToken: string }> {
    const { data } = await this._api.post<{ accessToken: string }>('/login', { email, password });
    return data;
  }

  async authUser(token: string, host: string): Promise<AuthUserResponse> {
    const hostName: string = process.env.APP_NAME ? process.env.APP_NAME : '';
    // const selfHosted: boolean = host.indexOf(SiteApi.APP_DOMAIN) === -1;
    const selfHosted: boolean = hostName.indexOf(SiteApi.APP_DOMAIN) === -1;

    let port = undefined;
    if (!selfHosted) {
      port = process.env.APP_PORT ? parseInt(process.env.APP_PORT) : '99';
    }

    const { data } = await this.api(token).post('/auth', { port });

    if (!data.auth?.id) {
      const e = new Error('Auth data error');
      // @ts-ignore
      e.context = { port, host };
      throw e;
    }
    await this.cacheService.set(`${SiteApi.USER_TOKEN_CACHE_KEY}_${data.auth.id}`, token);
    return data;
  }

  async getBundle(strategy: StrategyItem, accountId: string): Promise<StoreBundleResponse> {
    const cacheKey: string = `${SiteApi.BUNDLE_CACHE_KEY}_${accountId}_${strategy.type}_${strategy.id}`;
    const cached = await this.cacheService.get(cacheKey);
    if (!!cached) {
      return JSON.parse(cached) as StoreBundleResponse;
    }

    const token = await this.cacheService.get(`${SiteApi.USER_TOKEN_CACHE_KEY}_${accountId}`);
    try {
      const url = `/bundles/${strategy.type}/${strategy.id}?mode=${strategy.mode ?? 'runtime'}`;
      const { data } = await this.api(token).get(url);

      if (!data.content) {
        throw new Error('Invalid strategy');
      }

      await this.cacheService.set(cacheKey, JSON.stringify(data), SiteApi.BUNDLE_CACHE_TIMEOUT);
      return data;
    } catch (e) {
      throw e;
    }
  }

  async getBundles(accountId: string): Promise<UserBundlesResponse> {
    const token = await this.cacheService.get(`${SiteApi.USER_TOKEN_CACHE_KEY}_${accountId}`);

    try {
      const { data } = await this.api(token).get<UserBundlesResponse>('/bundles');
      return data;
    } catch (e) {
      throw e;
    }
  }

  async pushBundle(request: UploadBundleRequest, accountId: string): Promise<UploadBundleResponse> {
    const { sourceMap, content, name, definedArgs, version } = request;
    const formData = new FormData();

    formData.append('bundle', content, { filename: name, contentType: 'text/plain' });
    formData.append('source_map', sourceMap, { filename: name, contentType: 'text/plain' });
    formData.append('name', name);
    if (definedArgs) {
      formData.append('definedArgs', definedArgs);
    }
    if (version) {
      formData.append('version', version);
    }

    const token = await this.cacheService.get(`${SiteApi.USER_TOKEN_CACHE_KEY}_${accountId}`);

    const { data } = await this.api(token).post('/bundles/upload', formData, {
      headers: formData.getHeaders(),
    });

    return data;
  }

  private api(token: string) {
    this._api.defaults.headers.authorization = `Bearer ${token}`;
    return this._api;
  }
}
