import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { ChangeEvent, FC, useState } from "react";
import { useParams } from "react-router-dom";
import { Artifact, ChartPlayback, useArtifact } from "@/entities/artifact";
import { useConfig } from "@/entities/config";
import { Page } from "@/shared/ui/page";

interface PlaybackPageProps {
  title: string;
}

const PlaybackPage: FC<PlaybackPageProps> = (props) => {
  const { title } = props;

  const { artifactsId } = useParams();
  const { s3Host } = useConfig();
  const { artifact, isLoading } = useArtifact({ artifactsId });

  const [mockArtifact, setMockArtifact] = useState<Artifact | null>(null);
  const [fieldValue, setFieldValue] = useState("");
  const [error, setError] = useState("");

  if (!s3Host) {
    console.error("s3Host is not provided");
    return null;
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError("");
    setMockArtifact(null);
    setFieldValue(e.target.value);
    try {
      const data = JSON.parse(e.target.value);
      setMockArtifact({
        id: "mock",
        symbol: "mock",
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        blocks: [{ type: "chart_playback", isVisible: true, data: { symbols: [data] } }],
      });
    } catch (e) {
      setError("Invalid JSON");
      console.error("wrong json");
    }
  };

  return (
    <Page title={title}>
      {!artifact && !isLoading && (
        <Box sx={{ mb: 3 }}>
          <TextField
            value={fieldValue}
            onChange={handleInputChange}
            multiline
            rows={8}
            fullWidth
            helperText={error}
            error={!!error}
          />
        </Box>
      )}

      {(!!artifact || !!mockArtifact) && (
        <ChartPlayback s3Host={s3Host} artifact={mockArtifact ?? artifact} />
      )}
    </Page>
  );
};

export default PlaybackPage;
