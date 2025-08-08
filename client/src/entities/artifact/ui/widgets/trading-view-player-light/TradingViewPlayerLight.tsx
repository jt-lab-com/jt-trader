import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { IChartApi } from "lightweight-charts";
import { FC, useEffect, useRef, useState } from "react";
import { useBoolean } from "@/shared/lib/hooks/useBoolean";
import { TVChartLight } from "@/shared/ui/tv-chart-light";
import { ChartPlaybackDatafeed } from "../../../lib/chart-playback/datafeed";
import { chartEvents } from "../../../lib/chart-playback/events";
import { ChartPlayerSpeed } from "../../../lib/chart-playback/player";
import { ChartPlaybackData } from "../../../model/types";
import { PlayButton } from "./PlayButton";
import { SpeedSelector } from "./SpeedSelector";

interface TradingViewPlayerLightProps {
  data: ChartPlaybackData;
  s3Host: string;
}

export const TradingViewPlayerLight: FC<TradingViewPlayerLightProps> = (props) => {
  const { data, s3Host } = props;
  const chartRef = useRef<IChartApi | null>(null);
  const datafeedRef = useRef<ChartPlaybackDatafeed | null>(null);
  const playing = useBoolean();

  const [chartSpeed, setChartSpeed] = useState(ChartPlayerSpeed.x1);
  const [currentSymbolIndex, setCurrentSymbolIndex] = useState(0);

  useEffect(() => {
    if (!chartRef.current || datafeedRef.current) return;
    datafeedRef.current = new ChartPlaybackDatafeed({ chart: chartRef.current, s3Host });
  }, [chartRef.current]);

  useEffect(() => {
    handleLoadChart();
    const eventListeners = [chartEvents.on("end", handlePlaybackEnd)];

    return () => {
      eventListeners.forEach((unsub) => unsub());
    };
  }, [currentSymbolIndex]);

  const handlePlaybackEnd = () => {
    playing.onFalse();
    if (currentSymbolIndex === data.symbols.length - 1) return;
    setCurrentSymbolIndex((prev) => ++prev);
  };

  const handleLoadChart = () => {
    if (!datafeedRef.current) return;
    const playbackData = data.symbols[currentSymbolIndex];
    void datafeedRef.current.loadChart({ ...playbackData, defaultSpeed: chartSpeed });
  };

  const handleSpeedChange = (speed: ChartPlayerSpeed) => {
    setChartSpeed(speed);
    chartEvents.emit("speedChange", speed);
  };

  const handlePlayClicked = () => {
    playing.onToggle();
    chartEvents.emit(playing.value ? "pause" : "play");
  };

  return (
    <Stack sx={{ flexGrow: 1, height: "100%" }}>
      <Box sx={{ mb: 3, height: "20%" }}>
        <Stack direction={"row"} gap={3}>
          <Box>
            <Typography sx={{ mb: 3 }} variant={"h5"}>
              {data.symbols[currentSymbolIndex].symbol} | {data.symbols[currentSymbolIndex].interval}
            </Typography>
            <Stack direction={"row"} gap={3} alignItems={"center"}>
              <PlayButton isPlaying={playing.value} onClick={handlePlayClicked} />
              <SpeedSelector chartSpeed={chartSpeed} onChange={handleSpeedChange} />
            </Stack>
          </Box>
          <Divider flexItem orientation={"vertical"} />
        </Stack>
      </Box>
      <TVChartLight sx={{ height: "75vh", border: "1px solid black" }} chartRef={chartRef} />
    </Stack>
  );
};
