import { createAsyncThunk } from "@reduxjs/toolkit";
import { EngineMode, configActions } from "@/entities/config";
import { AuthData, userActions } from "@/entities/user";
import { wsConnect } from "@/shared/api/socket";
import { LS_ACCESS_SECRET_KEY, LS_ACCESS_TOKEN_KEY } from "@/shared/const/local-storage";
import { ThunkConfig } from "@/shared/types/store";

interface AuthOptions {
  forceReconnect?: boolean;
  onAuthSuccess?: VoidFunction;
  onAuthFailure?: (message: string) => void;
}

export const auth = createAsyncThunk<void, AuthOptions | undefined, ThunkConfig<string>>(
  "app/initialize",
  (options = {}, thunkAPI) => {
    const { forceReconnect = false, onAuthFailure, onAuthSuccess } = options;
    const { dispatch } = thunkAPI;

    const url = new URL(document.location.href);
    const searchParams = url.searchParams;

    let token = searchParams.get("auth");

    if (token) {
      localStorage.setItem(LS_ACCESS_TOKEN_KEY, token);
      searchParams.delete("auth");
      history.replaceState({}, "", url);
    }

    if (!token) {
      token = localStorage.getItem(LS_ACCESS_TOKEN_KEY) ?? "";
    }

    const accessSecret = localStorage.getItem(LS_ACCESS_SECRET_KEY) ?? "";

    wsConnect(token, {
      forceReconnect,
      accessSecret,
      onAuthSuccess: (payload: AuthData & { engineMode: EngineMode }) => {
        dispatch(userActions.setAuthData(payload));
        dispatch(configActions.setEngineMode(payload.engineMode));
        onAuthSuccess?.();
      },
      onAuthRejected: ({ code }) => {
        dispatch(userActions.setAuthError(code));
        onAuthFailure?.("Unauthorized");
      },
    });
  }
);
