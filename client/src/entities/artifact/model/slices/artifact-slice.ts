import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchArtifact } from "../services/fetch-artifact";
import { Artifact, ArtifactSchema } from "../types";

const initialState: ArtifactSchema = {
  data: null,
  isLoading: false,
};

const artifactSlice = createSlice({
  name: "artifact",
  initialState,
  reducers: {
    setArtifact: (state, action: PayloadAction<Artifact>) => {
      state.data = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchArtifact.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchArtifact.fulfilled, (state, action) => {
      state.data = action.payload;
      state.isLoading = false;
    });
    builder.addCase(fetchArtifact.rejected, (state) => {
      state.isLoading = false;
    });
  },
});

export const { reducer: artifactReducer } = artifactSlice;
export const { actions: artifactActions } = artifactSlice;
