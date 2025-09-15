import { StateSchema } from "@/shared/types/store";

export const getArtifact = (state: StateSchema) => state.artifact.artifact;
export const isArtifactLoading = (state: StateSchema) => state.artifact.isLoading;
export const getPreview = (key?: string) => (state: StateSchema) => key ? state.artifact.preview[key] : null;
