import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchArtifact } from "../services/fetch-artifact";
import { previewExecutionRequest } from "../services/preview-execution-request";
import { Artifact, ArtifactSchema } from "../types";

const initialState: ArtifactSchema = {
  artifact: null,
  preview: {},
  isLoading: false,
};

const artifactSlice = createSlice({
  name: "artifact",
  initialState,
  reducers: {
    setArtifact: (state, action: PayloadAction<Artifact>) => {
      state.artifact = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchArtifact.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchArtifact.fulfilled, (state, action) => {
      state.artifact = action.payload;
      state.isLoading = false;
    });
    builder.addCase(fetchArtifact.rejected, (state) => {
      state.isLoading = false;
    });
    builder.addCase(previewExecutionRequest.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(previewExecutionRequest.fulfilled, (state, action) => {
      const { key, data } = action.payload;
      if (data) {
        state.preview[key] = data;
      }
      state.isLoading = false;
    });
    builder.addCase(previewExecutionRequest.rejected, (state) => {
      state.isLoading = false;
    });
  },
});

export const { reducer: artifactReducer } = artifactSlice;
export const { actions: artifactActions } = artifactSlice;
