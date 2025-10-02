import { CacheDriverInterface } from './cache-driver.interface';
import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { promisify } from 'util';
import * as os from 'os';

@Injectable()
export class RedisDriver implements CacheDriverInterface {
  private setter: (...args: any[]) => Promise<void>;
  private publisher: (...args: any[]) => Promise<void>;
  private subscribers: Map<number, { event: string; callback: (data: any) => Promise<void> | void }>;
  private sequence: number;

  constructor(
    @InjectRedis() private readonly client: Redis,
    @InjectRedis('subscriber') private readonly clientSubscriber: Redis,
    @InjectPinoLogger(RedisDriver.name) private readonly logger: PinoLogger,
  ) {
    logger.info('Cache RedisDriver selected');
    this.setter = promisify(client.set).bind(client);
    this.publisher = promisify(client.publish).bind(client);

    this.subscribers = new Map();
    this.sequence = 0;

    this.clientSubscriber.on('message', (channel, data) => {
      if (this.subscribers.size === 0) return;
      for (const [, { event, callback }] of this.subscribers.entries()) {
        if (channel === event) callback(data);
      }
    });
  }

  keys = (key: string): Promise<string[]> =>
    new Promise<string[]>((resolve, reject) => {
      this.client.keys(key, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

  get = (key: string): Promise<string> =>
    new Promise<string>((resolve, reject) => {
      this.client.get(key, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

  set = async (key: string, data: string, ttl: number): Promise<void> => {
    return await this.setter(`${os.hostname()}::${key}`, data, 'EX', ttl);
  };

  delete = (key: string): Promise<void> =>
    new Promise<void>((resolve, reject) => {
      this.client.del(key, (err) => {
        if (err) reject(err);
        resolve();
      });
    });

  deleteBulk = (keys: string[]): Promise<void> =>
    new Promise<void>((resolve, reject) => {
      this.client.del(keys, (err) => {
        if (err) reject(err);
        resolve();
      });
    });

  subscribe = (key: string, callback: (data: any) => void): number => {
    const id = ++this.sequence;
    this.clientSubscriber.subscribe(key);
    this.subscribers.set(id, { event: key, callback });
    this.sequence++;
    return id;
  };

  unsubscribe = (id: number): void => {
    this.subscribers.delete(id);
  };

  publish = async (key: string, message: any, toJSON = false): Promise<any> => {
    return await this.publisher(key, toJSON ? JSON.stringify(message) : message);
  };
}
