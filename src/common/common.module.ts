import { Module } from '@nestjs/common';
import { SiteApi } from './api/site-api';
import { CacheService } from './cache/cache.service';
import { RedisModule } from '@liaoliaots/nestjs-redis';

@Module({
  imports: [
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
  ],
  providers: [SiteApi, CacheService],
  exports: [SiteApi, CacheService],
})
export class CommonModule {}
