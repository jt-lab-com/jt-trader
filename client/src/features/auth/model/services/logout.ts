import { createAsyncThunk } from "@reduxjs/toolkit";
import { userActions } from "@/entities/user";
import { LS_ACCESS_SECRET_KEY, LS_ACCESS_TOKEN_KEY } from "@/shared/const/local-storage";
import { ThunkConfig } from "@/shared/types/store";
import { auth } from "./auth";

export const logout = createAsyncThunk<void, void, ThunkConfig<void>>("auth/logout", async (_, thunkAPI) => {
  const { dispatch } = thunkAPI;

  localStorage.removeItem(LS_ACCESS_TOKEN_KEY);
  localStorage.removeItem(LS_ACCESS_SECRET_KEY);

  dispatch(userActions.logout());
  dispatch(auth(true));
});
