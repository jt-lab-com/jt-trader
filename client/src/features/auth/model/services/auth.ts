import { createAsyncThunk } from "@reduxjs/toolkit";
import { EngineMode, configActions } from "@/entities/config";
import { AuthData, userActions } from "@/entities/user";
import { wsConnect } from "@/shared/api/socket";
import { LS_ACCESS_TOKEN_KEY } from "@/shared/const/local-storage";
import { ThunkConfig } from "@/shared/types/store";

export const auth = createAsyncThunk<void, boolean | undefined, ThunkConfig<void>>(
  "app/initialize",
  (forceReconnect, thunkAPI) => {
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

    wsConnect(token, {
      forceReconnect,
      onAuthSuccess: (payload: AuthData & { engineMode: EngineMode }) => {
        dispatch(userActions.setAuthData(payload));
        dispatch(configActions.setEngineMode(payload.engineMode));
      },
      onAuthRejected: () => {
        dispatch(userActions.setAuthError());
      },
    });
  }
);
