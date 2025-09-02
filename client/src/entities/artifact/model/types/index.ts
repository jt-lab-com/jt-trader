import { Artifact } from "./artifact";

export * from "./artifact";
export * from "./chart-playback";

export interface ArtifactSchema {
  artifact: Artifact | null;
  preview: Record<string, Artifact>;
  isLoading: boolean;
}
