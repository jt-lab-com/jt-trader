import { Artifact } from "./artifact";

export * from "./artifact";
export * from "./trading-view";

export interface ArtifactSchema {
  artifact: Artifact | null;
  preview: Record<string, Artifact>;
  isLoading: boolean;
}
