import { StateSchema } from "@/shared/types/store";

export const isAuthSelector = (state: StateSchema) => !!state.user.authData;
export const isAuthLoadingSelector = (state: StateSchema) => state.user.isLoading;
export const getAuthData = (state: StateSchema) => state.user.authData;
