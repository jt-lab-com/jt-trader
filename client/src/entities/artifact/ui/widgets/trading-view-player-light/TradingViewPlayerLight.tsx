import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { IChartApi } from "lightweight-charts";
import { FC, useEffect, useRef, useState } from "react";
import { useBoolean } from "@/shared/lib/hooks/useBoolean";
import { TVChartLight } from "@/shared/ui/tv-chart-light";
import { ChartPlaybackDatafeed } from "../../../lib/chart-playback/datafeed";
import { chartEvents, Events } from "../../../lib/chart-playback/events";
import { ChartPlayerSpeed } from "../../../lib/chart-playback/player";
import { PlaybackChartSymbolData } from "../../../model/types";
import { CardList } from "./cards/CardList";
import { PlayButton } from "./PlayButton";
import { SpeedSelector } from "./SpeedSelector";

interface TradingViewPlayerLightProps {
  data: PlaybackChartSymbolData;
  s3Host: string;
}

export const TradingViewPlayerLight: FC<TradingViewPlayerLightProps> = (props) => {
  const { data, s3Host } = props;
  const { cards } = data;
  const chartRef = useRef<IChartApi | null>(null);
  const datafeedRef = useRef<ChartPlaybackDatafeed | null>(null);
  const playing = useBoolean();

  const [chartSpeed, setChartSpeed] = useState(ChartPlayerSpeed.x1);

  useEffect(() => {
    const unsub = chartEvents.on(Events.End, () => {
      playing.onFalse();
    });

    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current || datafeedRef.current) return;
    datafeedRef.current = new ChartPlaybackDatafeed({ chart: chartRef.current, s3Host });
    datafeedRef.current.loadChart({ ...data, defaultSpeed: chartSpeed }).catch((e) => {
      console.error(e);
    });
  }, [chartRef.current]);

  const handleSpeedChange = (speed: ChartPlayerSpeed) => {
    setChartSpeed(speed);
    chartEvents.emit(Events.SpeedChange, speed);
  };

  const handlePlayClicked = () => {
    playing.onToggle();
    chartEvents.emit(playing.value ? Events.Pause : Events.Play);
  };

  return (
    <Stack sx={{ flexGrow: 1, height: "100%", overflow: "hidden" }}>
      <Box sx={{ mb: 3, height: "20%" }}>
        <Stack direction={"row"} gap={3}>
          <Box>
            <Typography sx={{ mb: 3 }} variant={"h5"}>
              {data.symbol} | {data.interval}
            </Typography>
            <Stack direction={"row"} gap={3} alignItems={"center"}>
              <PlayButton isPlaying={playing.value} onClick={handlePlayClicked} />
              <SpeedSelector chartSpeed={chartSpeed} onChange={handleSpeedChange} />
            </Stack>
          </Box>
          <Divider flexItem orientation={"vertical"} />
          <CardList data={cards} />
        </Stack>
      </Box>
      <TVChartLight sx={{ height: "75vh", border: "1px solid black" }} chartRef={chartRef} />
    </Stack>
  );
};
