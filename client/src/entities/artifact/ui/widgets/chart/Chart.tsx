import { useTheme } from "@mui/material/styles";
import { ApexOptions } from "apexcharts";
import { FC } from "react";
import { ApexChart } from "@/shared/ui/apex-chart";
import { ChartData } from "../../../model/types";

interface ChartProps {
  data: ChartData;
}

export const Chart: FC<ChartProps> = (props) => {
  const { data } = props;

  const theme = useTheme();

  const defaultColors = ["#3F51B5", "#13D8AA", "#FD6A6A"];
  const seriesColors = data.colors ?? defaultColors;

  const series = data.series.map((series) => ({
    name: series.name,
    data: series.data,
  }));

  const options: ApexOptions = {
    chart: {
      height: 350,
      type: data.type ?? "area",
      stacked: false,
      animations: {
        enabled: false,
      },
    },
    legend: {
      labels: {
        colors: theme.palette.text.primary,
      },
    },
    colors: data.series.map((series, i) => {
      let color = series.color;

      if (!color) {
        const colorIndex = i % seriesColors.length;
        color = seriesColors[colorIndex];
      }

      return color;
    }),
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: [2, 2, 2],
      // curve: "smooth",
      curve: "straight",
    },
    yaxis: [
      {
        labels: {
          style: {
            colors: theme.palette.text.primary,
          },
        },
        axisTicks: {
          show: false,
        },
        axisBorder: {
          show: false,
        },
      },
    ],
    xaxis: {
      type: "datetime",
      categories: data.time,
      labels: {
        style: {
          colors: theme.palette.text.primary,
        },
      },
    },
    tooltip: {
      x: {
        format: "dd/MM/yy HH:mm",
      },
    },
  };

  return <ApexChart options={options} type={data.type ?? "area"} series={series} />;
};
