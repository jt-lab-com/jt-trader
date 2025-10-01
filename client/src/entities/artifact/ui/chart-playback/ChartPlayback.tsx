import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { FC } from "react";
import { groupBlocks } from "../../lib/utils/group-blocks";
import { Artifact, ArtifactBlockType, PlaybackChartSymbolData } from "../../model/types";
import { TradingViewPlayerLight } from "../widgets/trading-view-player-light/TradingViewPlayerLight";

interface ChartPlaybackProps {
  artifact: Artifact | null;
}

export const ChartPlayback: FC<ChartPlaybackProps> = (props) => {
  const { artifact } = props;

  if (!artifact) return null;

  const groupedBlocks = groupBlocks(artifact.blocks);
  const playbackData = groupedBlocks.find((block) => block.type === ArtifactBlockType.CHART_PLAYBACK)
    ?.data as PlaybackChartSymbolData;

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
      <TradingViewPlayerLight data={playbackData} />
    </Stack>
  );
};
