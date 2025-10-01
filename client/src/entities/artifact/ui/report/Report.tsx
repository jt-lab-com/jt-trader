import { Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { FC } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { downloadJSON } from "@/shared/lib/utils/download";
import { Iconify } from "@/shared/ui/iconify";
import { Image } from "@/shared/ui/image";
import { groupBlocks } from "../../lib/utils/group-blocks";
import { Artifact } from "../../model/types";
import { BlockList } from "./BlockList";

interface ReportProps {
  artifact: Artifact;
  isPreview?: boolean;
}

export const Report: FC<ReportProps> = (props) => {
  const { artifact, isPreview } = props;

  const filteredBlocks = artifact?.blocks?.filter((block) => !!block);
  const blocks = groupBlocks(filteredBlocks);

  const handleDownload = () => {
    downloadJSON(artifact, artifact.id);
  };

  const fallbackRender = (
    <Stack sx={{ width: "100%", height: "100%" }} alignItems={"center"} justifyContent={"center"}>
      <Typography variant={"h3"}>Error</Typography>
      <Typography variant={"subtitle2"}>Invalid report data</Typography>
    </Stack>
  );

  return (
    <Stack sx={{ height: "100%" }} gap={3}>
      {!isPreview && (
        <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}>
          <Box sx={{ minWidth: 116 }} />
          <Stack direction={"row"} justifyContent={"center"} alignItems={"center"} gap={1.5}>
            <Image src={"/logo.svg"} />
            <Typography sx={{ fontSize: 26, fontWeight: 600 }} color={"primary"}>
              jt-lab.com
            </Typography>
          </Stack>
          <Button
            startIcon={<Iconify icon={"solar:download-minimalistic-linear"} />}
            variant={"outlined"}
            onClick={handleDownload}
          >
            Download
          </Button>
        </Stack>
      )}

      <ErrorBoundary fallback={fallbackRender}>
        {!isPreview && !blocks.length && (
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
              <Typography>Report data is empty</Typography>
            </Box>
          </Box>
        )}

        <BlockList artifactId={artifact.id} blocks={blocks} />
      </ErrorBoundary>
    </Stack>
  );
};
