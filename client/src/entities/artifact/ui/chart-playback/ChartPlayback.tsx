import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { FC } from "react";
import { groupBlocks } from "../../lib/utils/group-blocks";
import { Artifact, ArtifactBlockType, ChartPlaybackData } from "../../model/types";
import { TradingViewPlayerLight } from "../widgets/trading-view-player-light/TradingViewPlayerLight";

interface ChartPlaybackProps {
  artifact: Artifact | null;
  s3Host: string;
}

export const ChartPlayback: FC<ChartPlaybackProps> = (props) => {
  const { artifact, s3Host } = props;

  if (!artifact) return null;

  const groupedBlocks = groupBlocks(artifact.blocks);
  const playbackData = groupedBlocks.find((block) => block.type === ArtifactBlockType.CHART_PLAYBACK)
    ?.data as ChartPlaybackData;

  if (!playbackData) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexGrow: 1,
          height: "100%",
          width: "100%",
        }}
      >
        <Box>
          <Typography>Chart playback data is empty</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Stack sx={{ flexGrow: 1 }} gap={3}>
      <TradingViewPlayerLight s3Host={s3Host} data={playbackData} />
    </Stack>
  );
};
