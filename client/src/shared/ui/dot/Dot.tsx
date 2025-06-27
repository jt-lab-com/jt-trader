import Box from "@mui/material/Box";
import { SxProps } from "@mui/material/styles";
import { FC } from "react";

interface DotProps {
  color: string;
  sx?: SxProps;
}

export const Dot: FC<DotProps> = (props) => {
  const { color, sx } = props;

  return <Box sx={{ ...sx, width: 10, height: 10, background: color, borderRadius: "50%" }} />;
};
