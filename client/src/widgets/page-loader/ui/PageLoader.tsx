import Box, { BoxProps } from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import { FC } from "react";

export const PageLoader: FC<BoxProps> = (props) => {
  const { sx, ...other } = props;

  return (
    <Box
      sx={{
        px: 5,
        flexGrow: 1,
        minHeight: 1,
        position: "fixed",
        height: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...sx,
      }}
      {...other}
    >
      <LinearProgress color="inherit" sx={{ width: 1, maxWidth: 360 }} />
    </Box>
  );
};
