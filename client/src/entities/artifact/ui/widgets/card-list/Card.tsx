import { Typography } from "@mui/material";
import Box from "@mui/material/Box";
import MUICard from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import { alpha, styled, useTheme } from "@mui/material/styles";
import dayjs from "dayjs";
import { AnimatePresence, m } from "framer-motion";
import { FC, ReactElement, ReactNode, useEffect, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useApexChart } from "@/shared/lib/hooks/useApexChart";
import { useBoolean } from "@/shared/lib/hooks/useBoolean";
import { fCurrency, fShortenCurrency, fShortenNumber } from "@/shared/lib/utils/format-number";
import { ApexChart } from "@/shared/ui/apex-chart";
import { CardData, ReportCardIcon, ReportCardNumberFormat, ReportCardVariant } from "../../../model/types";
import ChartDownIcon from "./assets/chart-down.svg?react";
import ChartUpIcon from "./assets/chart-up.svg?react";

const icons: Record<ReportCardIcon, ReactElement> = {
  [ReportCardIcon.ChartUp]: <ChartUpIcon />,
  [ReportCardIcon.ChartDown]: <ChartDownIcon />,
};

interface CardProps {
  data: CardData;
}

export const Card: FC<CardProps> = (props) => {
  const { data } = props;

  const handleLog = (e: Error) => {
    console.error(e);
  };

  if (data.variant === ReportCardVariant.Percent)
    return (
      <ErrorBoundary fallback={null} onError={handleLog}>
        <CardPercent data={data} />
      </ErrorBoundary>
    );

  return (
    <ErrorBoundary fallback={null} onError={handleLog}>
      <CardDefault data={data} />
    </ErrorBoundary>
  );
};

const BaseCard: FC<CardProps & { children: ReactNode }> = (props) => {
  const { data, children } = props;

  const init = useBoolean();
  const highlight = useBoolean();
  const [highlightColor, setHighlightColor] = useState<string>();
  const theme = useTheme();
  const prevValue = useRef<number>(+data.value);

  useEffect(() => {
    if (!init.value) return;
    if (data.variant === ReportCardVariant.Number) {
      if (isNaN(prevValue.current)) {
        highlightCard(alpha(theme.palette.primary.main, 0.2));
      }

      if (prevValue.current < +data.value) {
        highlightCard(alpha(theme.palette.primary.main, 0.2));
      }

      if (prevValue.current > +data.value) {
        highlightCard(alpha(theme.palette.error.main, 0.2));
      }

      prevValue.current = +data.value;

      return;
    }

    highlightCard(alpha(theme.palette.info.main, 0.2));
  }, [data.value]);

  useEffect(() => {
    init.onTrue();
  }, []);

  const highlightCard = (color: string) => {
    setHighlightColor(color);
    highlight.onTrue();

    setTimeout(() => {
      setHighlightColor(undefined);
      highlight.onFalse();
    }, 700);
  };

  return (
    <MUICard sx={{ position: "relative", p: 3, height: 150, width: 300 }} raised={true}>
      <AnimatePresence initial={false}>
        {highlight.value && highlightColor && (
          <BaseHighlight
            sx={{ background: highlightColor }}
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: 1, scale: 15.5 }}
            transition={{
              duration: 0.3,
              type: "tween",
            }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {children}
    </MUICard>
  );
};

const CardDefault: FC<CardProps> = (props) => {
  const { data } = props;

  const format = data.options?.format ?? ReportCardNumberFormat.Default;

  let value = data.value;

  if (data.variant === ReportCardVariant.Number) {
    switch (format) {
      case ReportCardNumberFormat.Default:
        value = +data.value;
        break;
      case ReportCardNumberFormat.Date:
        value = dayjs(data.value).format("DD.MM.YYYY HH:mm");
        break;
      case ReportCardNumberFormat.Currency:
        if (+value > 100000) {
          value = fShortenCurrency(data.value, data.options?.currency ?? "USD");
          break;
        }

        value = +value ? fCurrency(data.value, data.options?.currency ?? "USD") : "$0";
        break;
      case ReportCardNumberFormat.Short:
        value = fShortenNumber(data.value);
        break;
    }
  }

  return (
    <BaseCard data={data}>
      <Stack sx={{ width: "100%", height: "100%" }} alignItems={"space-between"}>
        <Typography variant={"subtitle2"}>{data.title}</Typography>
        <Stack
          sx={{ pt: 0, flex: 1, width: "100%" }}
          gap={2}
          direction={"row"}
          alignItems={"center"}
          justifyContent={"space-between"}
        >
          <Typography variant={"h5"}>{value}</Typography>

          {data.options?.icon && <>{icons[data.options.icon]}</>}
        </Stack>
        <Typography sx={{ minHeight: 18 }} variant={"caption"} color={"text.disabled"}>
          {data.options?.caption}
        </Typography>
      </Stack>
    </BaseCard>
  );
};

const CardPercent: FC<CardProps> = (props) => {
  const { data } = props;
  const theme = useTheme();

  const chartOptions = useApexChart({
    chart: {
      sparkline: {
        enabled: true,
      },
    },
    legend: {
      show: false,
    },
    colors: [theme.palette.info.main],
    stroke: {
      lineCap: "square",
    },
    plotOptions: {
      radialBar: {
        startAngle: 0,
        endAngle: 360,

        track: {
          show: true,
          background: alpha(theme.palette.info.main, 0.08),
          strokeWidth: "50%",
        },
        hollow: {
          size: "60%",
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            fontSize: "18px",
          },
        },
      },
    },
  });

  return (
    <BaseCard data={data}>
      <Stack sx={{ position: "relative", height: "100%" }} direction={"row"} justifyContent={"space-between"}>
        <Stack sx={{ height: "100%" }} justifyContent={"space-between"} alignItems={"flex-start"}>
          <Typography variant={"subtitle2"}>{data.title}</Typography>
          <Typography sx={{ minHeight: 18 }} variant={"caption"} color={"text.disabled"}>
            {data.options?.caption}
          </Typography>
        </Stack>

        <Box sx={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)" }}>
          <ApexChart
            type={"radialBar"}
            options={chartOptions}
            series={[+data.value]}
            height={120}
            width={120}
          />
        </Box>
      </Stack>
    </BaseCard>
  );
};

const BaseHighlight = styled(m.div)(() => ({
  position: "absolute",
  top: 0,
  left: 0,
  height: 40,
  width: 40,
  pointerEvents: "none",
  borderRadius: "50%",
}));
