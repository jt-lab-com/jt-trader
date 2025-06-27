import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import { Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { SxProps } from "@mui/system";
import { FC, ReactNode } from "react";

interface BlockContainerProps {
  name?: string;
  children: ReactNode;
  sx?: SxProps<Theme>;
}

export const BlockContainer: FC<BlockContainerProps> = (props) => {
  const { name, children, sx } = props;

  return (
    <Card sx={sx}>
      {name && (
        <Box sx={{ p: 3 }}>
          <Typography variant={"h4"}>{name}</Typography>
        </Box>
      )}
      {children}
    </Card>
  );
};
