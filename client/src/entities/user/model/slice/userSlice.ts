import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthData, UserSchema } from "../types";

const initialState: UserSchema = {
  authData: null,
  isLoading: true,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setAuthData: (state, action: PayloadAction<AuthData>) => {
      state.isLoading = false;
      state.authData = action.payload;
    },
    setAuthError: (state) => {
      state.isLoading = false;
      state.authData = null;
    },
    logout: (state) => {
      state.isLoading = false;
      state.authData = null;
    },
  },
});

export const { actions: userActions } = userSlice;
export const { reducer: userReducer } = userSlice;
