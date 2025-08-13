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
}

export const TradingViewPlayerLight: FC<TradingViewPlayerLightProps> = (props) => {
  const { data } = props;
  const chartRef = useRef<IChartApi | null>(null);
  const datafeedRef = useRef<ChartPlaybackDatafeed | null>(null);
  const playing = useBoolean();
  const isEnd = useBoolean();
  const ready = useBoolean();

  const [chartSpeed, setChartSpeed] = useState(ChartPlayerSpeed.x1);

  useEffect(() => {
    const unsub = chartEvents.on(Events.End, () => {
      playing.onFalse();
      isEnd.onTrue();
    });

    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current || datafeedRef.current) return;
    datafeedRef.current = new ChartPlaybackDatafeed(chartRef.current);
    datafeedRef.current
      .loadChart({ ...data, defaultSpeed: chartSpeed })
      .then(ready.onTrue)
      .catch((e) => {
        console.error(e);
      });
  }, [chartRef.current]);

  const handleSpeedChange = (speed: ChartPlayerSpeed) => {
    setChartSpeed(speed);
    chartEvents.emit(Events.SpeedChange, speed);
  };

  const handlePlayClicked = () => {
    if (isEnd.value) {
      ready.onFalse();
      datafeedRef.current?.loadChart({ ...data, defaultSpeed: chartSpeed }).then(() => {
        playing.onTrue();
        isEnd.onFalse();
        ready.onTrue();
        chartEvents.emit(Events.Play);
      });
      return;
    }

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
              <PlayButton
                isPlaying={playing.value}
                isEnd={isEnd.value}
                onClick={handlePlayClicked}
                disabled={!ready.value}
              />
              <SpeedSelector chartSpeed={chartSpeed} onChange={handleSpeedChange} disabled={!ready.value} />
            </Stack>
          </Box>
          <Divider flexItem orientation={"vertical"} />
          <CardList data={data.cards} />
        </Stack>
      </Box>
      <TVChartLight sx={{ height: "75vh", border: "1px solid black" }} chartRef={chartRef} />
    </Stack>
  );
};
