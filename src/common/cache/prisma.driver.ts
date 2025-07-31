import { Injectable } from '@nestjs/common';
import { CacheDriverInterface } from './cache-driver.interface';
import { PrismaService } from '../prisma/prisma.service';
import { Cache } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class PrismaDriver implements CacheDriverInterface {
  constructor(
    private readonly prismaService: PrismaService,
    @InjectPinoLogger(PrismaDriver.name) private readonly logger: PinoLogger,
  ) {
    logger.info('Cache PrismaDriver selected');
  }

  async delete(key: string): Promise<void> {
    await this.prismaService.cache.deleteMany({ where: { key } });
  }

  async get(key: string): Promise<string> {
    const row: Cache = await this.prismaService.cache.findFirst({ where: { key, expiredAt: { gt: new Date() } } });
    return row?.value;
  }

  async keys(key: string): Promise<string[]> {
    const keyCondition = key.indexOf('*') > -1 ? { contains: key.replace('*', '') } : key;
    const rows: Cache[] = await this.prismaService.cache.findMany({
      where: {
        key: keyCondition,
        expiredAt: { gt: new Date() },
      },
    });
    return rows.map((item) => item.key);
  }

  async set(key: string, data: string, ttl: number): Promise<void> {
    const fields = {
      value: data.toString(),
      expiredAt: new Date(Date.now() + ttl * 1000),
    };

    await this.prismaService.cache.upsert({
      where: { key },
      update: { ...fields },
      create: { key, ...fields },
    });
  }

  async deleteBulk(keys: string[]): Promise<void> {
    await this.prismaService.cache.deleteMany({ where: { key: { in: keys } } });
  }

  subscribe = (key: string, callback: (data: any) => void): number => {
    throw new Error('Invalid \'subscribe\' method via CACHE_DRIVER=\'disk\' value');
  };

  unsubscribe = (id: number): void => {
    throw new Error('Invalid \'unsubscribe\' method via CACHE_DRIVER=\'disk\' value');
  };

  publish = async (key: string, message: any, toJSON: boolean = false): Promise<any> => {
    throw new Error('Invalid \'publish\' method via CACHE_DRIVER=\'disk\' value');
  };
}