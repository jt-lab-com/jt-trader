import { WS_AUTH_ERROR_CODE } from "@packages/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthData, UserSchema } from "../types";

const initialState: UserSchema = {
  authData: null,
  errorCode: null,
  isLoading: true,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setAuthData: (state, action: PayloadAction<AuthData>) => {
      state.isLoading = false;
      state.authData = action.payload;
      state.errorCode = null;
    },
    setAuthError: (state, action: PayloadAction<WS_AUTH_ERROR_CODE>) => {
      state.isLoading = false;
      state.authData = null;
      state.errorCode = action.payload;
    },
    logout: (state) => {
      state.isLoading = false;
      state.authData = null;
      state.errorCode = null;
    },
  },
});

export const { actions: userActions } = userSlice;
export const { reducer: userReducer } = userSlice;
