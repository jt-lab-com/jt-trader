import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import { Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { SxProps } from "@mui/system";
import { FC, ReactNode } from "react";
import { useBoolean } from "@/shared/lib/hooks/useBoolean";
import { SvgColor } from "@/shared/ui/svg-color";

interface BlockContainerProps {
  name?: string;
  children: ReactNode;
  sx?: SxProps<Theme>;
}

export const BlockContainer: FC<BlockContainerProps> = (props) => {
  const { name, children, sx } = props;

  const toggle = useBoolean();

  return (
    <Card sx={sx}>
      <Stack sx={{ p: 3 }} direction={"row"} alignItems={"center"} gap={1}>
        {name && <Typography variant={"h4"}>{name}</Typography>}

        <Box>
          <IconButton size={"small"} onClick={toggle.onToggle}>
            <SvgColor
              sx={{ transform: `rotate(${toggle.value ? 180 : 0}deg)` }}
              src={`/assets/icons/solid/ic-eva_arrow-ios-downward-fill.svg`}
            />
          </IconButton>
        </Box>
      </Stack>

      {toggle.value && <>{children}</>}
    </Card>
  );
};
