import { StateSchema } from "@/shared/types/store";

export const getArtifact = (state: StateSchema) => state.artifact.data;
export const isArtifactLoading = (state: StateSchema) => state.artifact.isLoading;
