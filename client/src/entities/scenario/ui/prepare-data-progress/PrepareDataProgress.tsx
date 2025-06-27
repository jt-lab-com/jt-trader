import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import { alpha, styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { WS_SERVER_EVENTS } from "@packages/types";
import { AnimatePresence, m } from "framer-motion";
import { FC, memo, useEffect, useState } from "react";
import { subscribe } from "@/shared/api/socket";
import { useBoolean } from "@/shared/lib/hooks/useBoolean";
import { varSlide } from "@/shared/ui/animate";
import { Iconify } from "@/shared/ui/iconify";

interface PrepareDataProgressProps {}

export const PrepareDataProgress: FC<PrepareDataProgressProps> = memo(() => {
  const visible = useBoolean();
  const [quotes, setQuotes] = useState("");

  useEffect(() => {
    const unsubStart = subscribe(WS_SERVER_EVENTS.TESTER_SCENARIO_PREPARE_DATA_START, (payload) => {
      visible.onTrue();
      setQuotes(payload.symbol);
    });
    const unsubEnd = subscribe(WS_SERVER_EVENTS.TESTER_SCENARIO_PREPARE_DATA_END, () => {
      visible.onFalse();
      setQuotes("");
    });

    return () => {
      unsubStart();
      unsubEnd();
    };
  }, []);

  return (
    <AnimatePresence>
      {visible.value && (
        <Card
          component={m.div}
          {...varSlide({ distance: 320, durationIn: 0.3 }).inRight}
          sx={{ position: "fixed", bottom: 20, right: 20, zIndex: 10, minWidth: 280 }}
        >
          <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
            <Stack direction={"row"}>
              <StyledIcon color="info">
                <Iconify icon="solar:cloud-download-bold" width={27} />
              </StyledIcon>
              <Stack sx={{ flex: 1 }} alignItems={"flex-start"} gap={1}>
                <Typography variant={"body2"}>Downloading {quotes} quotes...</Typography>
                <Box sx={{ width: "100%" }}>
                  <LinearProgress />
                </Box>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}
    </AnimatePresence>
  );
});

type StyledIconProps = {
  color: "info" | "success" | "warning" | "error";
};

const StyledIcon = styled("span")<StyledIconProps>(({ color, theme }) => ({
  width: 44,
  height: 44,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginRight: theme.spacing(1.5),
  color: theme.palette[color].main,

  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette[color].main, 0.16),
}));
