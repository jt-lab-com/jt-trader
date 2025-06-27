import { AccountParamType } from '../../environment/account/types';
import { StrategyDefinedArg } from '@packages/types';

export interface AuthUserResponse {
  auth: UserAuthData;
  config: AccountParamType[];
  developerAccess: boolean;
}

export interface UserAuthData {
  id: string;
  email: string;
  developerAccess: boolean;
}

export interface StoreBundleResponse {
  id: string;
  version: number;
  name: string;
  content?: string;
  source_map?: string;
  defined_args?: StrategyDefinedArg[];
  bundleName?: string;
  mode?: 'runtime' | 'tester';
}

export interface UserBundlesResponse {
  bundles: StoreBundleResponse[];
  app_bundles: StoreBundleResponse[];
}

export interface UploadBundleRequest {
  name: string;
  content: Buffer;
  sourceMap: Buffer;
  warn: string;
  definedArgs?: string;
  version?: number;
}

export interface UploadBundleResponse {
  id: string;
}
