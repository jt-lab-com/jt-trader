import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Console as ConsoleFeed } from "@nicksrandall/console-feed";
import { Message } from "@nicksrandall/console-feed/lib/definitions/Component";
import { FC } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useLayoutSettings } from "@/shared/lib/hooks/useLayoutSettings";

interface ConsoleProps {
  logList: Message[];
}

export const Console: FC<ConsoleProps> = (props) => {
  const { logList } = props;
  const { themeMode } = useLayoutSettings();

  const Fallback = (
    <Stack
      sx={{ width: "100%", height: "100%" }}
      direction={"row"}
      alignItems={"center"}
      justifyContent={"center"}
    >
      <Box sx={{ display: "flex", height: 200, alignItems: "center" }}>
        <Typography>Error: Incorrect log format</Typography>
      </Box>
    </Stack>
  );

  return (
    <ErrorBoundary fallback={Fallback}>
      <ConsoleFeed
        logs={logList}
        variant={themeMode}
        styles={{
          BASE_LINE_HEIGHT: 1.2,
          BASE_FONT_FAMILY: "menlo, monospace",
          BASE_FONT_SIZE: "11px",
          BASE_BACKGROUND_COLOR: "var(--background-secondary-color)",
          // LOG_COLOR: "rgba(0,0,0,1)",
          // LOG_BORDER: "rgb(240, 240, 240)",
          LOG_ERROR_BACKGROUND: "var(--background-secondary-color)",
          LOG_ERROR_BORDER: "rgb(0deg 100% 92%)",
          LOG_ERROR_COLOR: "#f00",
        }}
      />
    </ErrorBoundary>
  );
};
