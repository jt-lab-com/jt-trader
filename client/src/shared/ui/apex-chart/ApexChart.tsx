import { alpha, styled } from "@mui/material/styles";
import { FC, memo } from "react";
import Chart, { Props } from "react-apexcharts";
import { bgBlur } from "../../lib/utils/css";

const StyledChart = memo(
  styled(Chart)(({ theme }) => ({
    "& .apexcharts-canvas": {
      // Tooltip
      "& .apexcharts-tooltip": {
        ...bgBlur({
          color: theme.palette.background.default,
        }),
        color: theme.palette.text.primary,
        boxShadow: theme.customShadows.dropdown,
        borderRadius: theme.shape.borderRadius * 1.25,
        "&.apexcharts-theme-light": {
          borderColor: "transparent",
          ...bgBlur({
            color: theme.palette.background.default,
          }),
        },
      },
      "& .apexcharts-xaxistooltip": {
        ...bgBlur({
          color: theme.palette.background.default,
        }),
        borderColor: "transparent",
        color: theme.palette.text.primary,
        boxShadow: theme.customShadows.dropdown,
        borderRadius: theme.shape.borderRadius * 1.25,
        "&:before": {
          borderBottomColor: alpha(theme.palette.grey[500], 0.24),
        },
        "&:after": {
          borderBottomColor: alpha(theme.palette.background.default, 0.8),
        },
      },
      "& .apexcharts-tooltip-title": {
        textAlign: "center",
        fontWeight: theme.typography.fontWeightBold,
        backgroundColor: alpha(theme.palette.grey[500], 0.08),
        color: theme.palette.mode === "light" ? theme.palette.text.primary : theme.palette.text.disabled,
      },

      // LEGEND
      "& .apexcharts-legend": {
        padding: 0,
      },
      "& .apexcharts-legend-series": {
        display: "inline-flex !important",
        alignItems: "center",
      },
      "& .apexcharts-legend-marker": {
        marginRight: 8,
      },
      "& .apexcharts-legend-text": {
        lineHeight: "18px",
        textTransform: "capitalize",
      },
    },
  }))
);

interface ApexChartProps extends Props {}

export const ApexChart: FC<ApexChartProps> = (props) => {
  return <StyledChart height={350} {...props} />;
};
