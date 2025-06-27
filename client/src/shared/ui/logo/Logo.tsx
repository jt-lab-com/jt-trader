import Box, { BoxProps } from "@mui/material/Box";
import { FC } from "react";

interface LogoProps extends BoxProps {
  width?: number | string;
  height?: number | string;
}

export const Logo: FC<LogoProps> = (props) => {
  const { sx, width, height } = props;

  return (
    <Box
      component="div"
      sx={{
        width: width ?? 40,
        height: height ?? 40,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        ...sx,
      }}
    >
      <Box component={"img"} src={`/logo.svg`} sx={{ width: "100%", height: "100%", cursor: "pointer" }} />
    </Box>
  );
};
