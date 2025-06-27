import Box, { BoxProps } from "@mui/material/Box";
import { createChart, DeepPartial, IChartApi, TimeChartOptions } from "lightweight-charts";
import { FC, MutableRefObject, useEffect, useRef } from "react";

interface TVChartLightProps extends BoxProps {
  chartRef: MutableRefObject<IChartApi | null>;
  chartOptions?: DeepPartial<TimeChartOptions>;
}

export const TVChartLight: FC<TVChartLightProps> = (props) => {
  const { sx, chartRef, chartOptions } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chartRef.current = createChart(containerRef.current ?? "tv-chart-light-container", {
      autoSize: true,
      ...chartOptions,
    });
  }, []);

  return <Box sx={sx} ref={containerRef} id={"tv-chart-light-container"} />;
};
