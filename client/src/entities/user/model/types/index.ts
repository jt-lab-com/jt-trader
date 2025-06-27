export interface UserSchema {
  authData: AuthData | null;
  isLoading: boolean;
}

export interface AuthData {
  id: number;
  email: string;
  developerAccess: boolean;
}
