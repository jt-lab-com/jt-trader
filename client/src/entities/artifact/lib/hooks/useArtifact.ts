import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/shared/lib/hooks/useAppDispatch";
import { useBoolean } from "@/shared/lib/hooks/useBoolean";
import { getArtifact, isArtifactLoading } from "../../model/selectors";
import { fetchArtifact } from "../../model/services/fetch-artifact";
import { subscribeArtifactUpdate } from "../../model/services/subscribe";
import { artifactActions } from "../../model/slices/artifact-slice";
import { Artifact } from "../../model/types";

interface UseArtifactReturnParams {
  artifact: Artifact | null;
  isLoading: boolean;
}

interface UseArtifactParams {
  initialArtifact?: Artifact;
  artifactsId?: string;
}

export const useArtifact = (params: UseArtifactParams): UseArtifactReturnParams => {
  const { initialArtifact, artifactsId } = params;
  const dispatch = useAppDispatch();
  const artifact = useSelector(getArtifact);
  const isLoading = useSelector(isArtifactLoading);
  const isSubscribed = useBoolean();

  useEffect(() => {
    if (!initialArtifact && artifactsId) {
      dispatch(fetchArtifact(artifactsId));
    }
  }, [artifactsId]);

  useEffect(() => {
    if (!initialArtifact) return;
    dispatch(artifactActions.setArtifact(initialArtifact));
  }, [dispatch, initialArtifact]);

  useEffect(() => {
    if (!artifact || isSubscribed.value || !artifactsId) return;

    dispatch(subscribeArtifactUpdate(artifactsId));

    isSubscribed.onTrue();
  }, [dispatch, artifact]);

  return {
    artifact,
    isLoading,
  };
};
