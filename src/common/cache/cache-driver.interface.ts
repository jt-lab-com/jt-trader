export interface CacheDriverInterface {
  keys: (key: string) => Promise<string[]>;

  get: (key: string) => Promise<string>;

  set: (key: string, data: string, ttl: number) => Promise<void>;

  delete: (key: string) => Promise<void>;

  deleteBulk: (keys: string[]) => Promise<void>;

  subscribe: (key: string, callback: (data: any) => void) => number;

  unsubscribe: (id: number) => void;

  publish: (key: string, message: any, toJSON?: boolean) => Promise<any>;
}
