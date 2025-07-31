import { Inject, Injectable } from '@nestjs/common';
import * as os from 'os';
import { CacheDriverInterface } from './cache-driver.interface';

const DEFAULT_TTL = 4 * 24 * 60 * 60;

@Injectable()
export class CacheService {
  constructor(@Inject('CacheDriverInterface') private readonly driver: CacheDriverInterface) {}

  private formatKey(key: string): string {
    return `${os.hostname()}::${key}`;
  }

  public keys(key: string): Promise<string[]> {
    return this.driver.keys(`${this.formatKey(key)}*`);
  }

  public get(key: string): Promise<string> {
    return this.driver.get(this.formatKey(key));
  }

  public set(key: string, data: string, ttl: number = DEFAULT_TTL): Promise<void> {
    return this.driver.set(this.formatKey(key), data, ttl);
  }

  public delete(key: string): Promise<void> {
    return this.driver.delete(this.formatKey(key));
  }

  public async deleteAllHostKeys(): Promise<void> {
    const keys = await this.keys('');
    if (!keys.length) return;

    return this.driver.deleteBulk(keys);
  }

  subscribe = this.driver.subscribe

  unsubscribe = this.driver.unsubscribe;

  publish = this.driver.publish;
}
