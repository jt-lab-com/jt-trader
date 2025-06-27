import { Artifact } from "./artifact";

export * from "./artifact";
export * from "./chart-playback";

export interface ArtifactSchema {
  data: Artifact | null;
  isLoading: boolean;
}
