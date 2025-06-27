import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import * as os from 'os';
import { promisify } from 'util';

const DEFAULT_TTL = 4 * 24 * 60 * 60;

@Injectable()
export class CacheService {
  private setter: (...args: any[]) => Promise<void>;
  private publisher: (...args: any[]) => Promise<void>;
  private subscribers: Map<number, { event: string; callback: (data: any) => Promise<void> | void }>;
  private sequence: number;

  constructor(
    @InjectRedis() private readonly client: Redis,
    @InjectRedis('subscriber') private readonly clientSubscriber: Redis,
  ) {
    this.setter = promisify(client.set).bind(client);
    this.publisher = promisify(client.publish).bind(client);

    this.subscribers = new Map();
    this.sequence = 0;

    if (!(process.env.DATA_PROXY_MODE === '1')) return;

    this.clientSubscriber.on('message', (channel, data) => {
      if (this.subscribers.size === 0) return;
      for (let [, { event, callback }] of this.subscribers.entries()) {
        if (channel === event) callback(data);
      }
    });
  }

  keys = (key: string): Promise<string[]> =>
    new Promise<string[]>((resolve, reject) => {
      this.client.keys(`${os.hostname()}::${key}*`, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

  get = (key: string): Promise<string> =>
    new Promise<string>((resolve, reject) => {
      this.client.get(`${os.hostname()}::${key}`, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

  set = async (key: string, data: string, ttl: number = DEFAULT_TTL): Promise<void> => {
    return await this.setter(`${os.hostname()}::${key}`, data, 'EX', ttl);
  };

  delete = (key: string): Promise<void> =>
    new Promise<void>((resolve, reject) => {
      this.client.del(`${os.hostname()}::${key}`, (err) => {
        if (err) reject(err);
        resolve();
      });
    });

  deleteAllHostKeys = async (): Promise<void> => {
    const keys = await this.keys('*');
    if (!keys.length) return;

    return await new Promise<void>((resolve, reject) => {
      this.client.del(keys, (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  };

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

  publish = async (key: string, message: any, toJSON: boolean = false): Promise<any> => {
    return await this.publisher(key, toJSON ? JSON.stringify(message) : message);
  };
}
