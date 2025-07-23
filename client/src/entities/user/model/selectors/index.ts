import { StateSchema } from "@/shared/types/store";

export const isAuthLoadingSelector = (state: StateSchema) => state.user.isLoading;
export const getAuthData = (state: StateSchema) => state.user.authData;
export const getAuthErrorCode = (state: StateSchema) => state.user.errorCode;
