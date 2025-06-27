import { WS_CLIENT_EVENTS, WS_SERVER_EVENTS } from "@packages/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { emitSocketEvent, subscribe } from "@/shared/api/socket";
import { LS_ACCESS_TOKEN_KEY } from "@/shared/const/local-storage";
import { ThunkConfig } from "@/shared/types/store";
import { auth } from "./auth";

export interface LoginParams {
  email: string;
  password: string;
}

export const login = createAsyncThunk<void, LoginParams, ThunkConfig<string>>(
  "auth/login",
  async (params, thunkAPI) => {
    const { dispatch, rejectWithValue } = thunkAPI;

    const request = () =>
      new Promise<void>((res, rej) => {
        const unsub = subscribe(WS_SERVER_EVENTS.LOGIN_RESPONSE, (payload) => {
          unsub();

          if (!payload.accessToken) {
            return rej(payload.message || "Invalid username or password");
          }

          localStorage.setItem(LS_ACCESS_TOKEN_KEY, payload.accessToken.replace("Bearer ", ""));
          dispatch(auth(true));
          res();
        });

        setTimeout(() => {
          rej("Response timed out");
          unsub();
        }, 15000);

        emitSocketEvent({ event: WS_CLIENT_EVENTS.LOGIN, payload: params });
      });

    try {
      await request();
    } catch (e) {
      return rejectWithValue(typeof e === "string" ? e : "Unexpected error");
    }
  }
);
