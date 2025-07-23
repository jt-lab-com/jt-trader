import { WS_AUTH_ERROR_CODE } from "@packages/types";

export interface UserSchema {
  authData: AuthData | null;
  errorCode: WS_AUTH_ERROR_CODE | null;
  isLoading: boolean;
}

export interface AuthData {
  id: number;
  email: string;
  developerAccess: boolean;
}
