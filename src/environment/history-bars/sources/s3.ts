import {
  GetObjectCommand,
  GetObjectCommandInput,
  ObjectCannedACL,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { HistoryBarsSource } from '../types';

@Injectable()
export class S3Source implements HistoryBarsSource {
  private readonly client: S3Client;
  sourceName = 's3';

  constructor() {
    this.client = new S3Client({
      endpoint: process.env.S3_HOST,
      forcePathStyle: false,
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
      },
    });
  }

  async upload(symbol: string, timeframe: string, date: Date, file: Buffer) {
    const key = this.getBucketKey(symbol, timeframe, date);

    const params: PutObjectCommandInput = {
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: file,
      ACL: ObjectCannedACL.public_read,
      CacheControl: 'max-age=3600',
    };

    return this.client.send(new PutObjectCommand(params));
  }

  async download(symbol: string, timeframe: string, date: Date): Promise<Buffer> {
    const key = this.getBucketKey(symbol, timeframe, date);

    const params: GetObjectCommandInput = {
      Bucket: process.env.S3_BUCKET,
      Key: key,
    };

    const data = await this.client.send(new GetObjectCommand(params));
    const byteArray = await data.Body.transformToByteArray();
    return Buffer.from(byteArray);
  }

  private getBucketKey(symbol: string, timeframe: string, date: Date): string {
    const formattedSymbol = symbol.replace('/', '').toUpperCase();
    const filename = `${formattedSymbol}-${timeframe}-${date.toISOString().slice(0, 7)}.zip`;
    const fileUrlPath = `${formattedSymbol}/${timeframe}/${filename}`;
    return `rates/${fileUrlPath}`;
  }
}
