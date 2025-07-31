import { Module } from '@nestjs/common';
import { SiteApi } from './api/site-api';
import { CacheService } from './cache/cache.service';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { PrismaService } from './prisma/prisma.service';
import { RedisDriver } from './cache/redis.driver';
import { PrismaDriver } from './cache/prisma.driver';

@Module({
  imports:
    process.env.CACHE_DRIVER === 'redis'
      ? [
        RedisModule.forRoot({
          config: [
            {
              url: process.env.REDIS_URL,
              onClientCreated(client) {
                client.on('error', (err) => {
                  throw err;
                });
              },
            },
            {
              namespace: 'subscriber',
              url: process.env.REDIS_URL,
              onClientCreated(client) {
                client.on('error', (err) => {
                  throw err;
                });
              },
            },
          ],
          closeClient: true,
        }),
      ]
      : [],
  providers: [
    SiteApi,
    PrismaService,
    {
      provide: 'CacheDriverInterface',
      useClass:
        {
          redis: RedisDriver,
          disk: PrismaDriver,
        }[process.env.CACHE_DRIVER] ?? PrismaDriver,
    },
    CacheService,
  ],
  exports: [SiteApi, PrismaService, CacheService],
})
export class CommonModule {}
