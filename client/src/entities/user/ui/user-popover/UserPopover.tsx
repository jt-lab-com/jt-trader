import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import { alpha } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { m } from "framer-motion";
import { FC } from "react";
import { usePopover } from "@/shared/lib/hooks/usePopover";
import { varHover } from "@/shared/ui/animate";
import { CustomPopover } from "@/shared/ui/custom-popover";
import { useAuth } from "../../lib/hooks/useAuth";

interface UserPopoverProps {
  onLogout: VoidFunction;
}

export const UserPopover: FC<UserPopoverProps> = (props) => {
  const { onLogout } = props;
  const { authData } = useAuth();
  const popover = usePopover();

  const handleNavigate = (path: string) => () => {
    window.open(path, "_blank");
  };

  return (
    <>
      <IconButton
        component={m.button}
        whileTap="tap"
        whileHover="hover"
        variants={varHover(1.05)}
        onClick={popover.onOpen}
        sx={{
          width: 40,
          height: 40,
          background: (theme) => alpha(theme.palette.grey[500], 0.08),
          ...(popover.open && {
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
          }),
        }}
      >
        <Avatar
          src={"/assets/default-user.png"}
          sx={{
            width: 36,
            height: 36,
            border: (theme) => `solid 2px ${theme.palette.background.default}`,
          }}
        ></Avatar>
      </IconButton>

      <CustomPopover open={popover.open} onClose={popover.onClose} sx={{ width: 230, p: 0 }}>
        <Box sx={{ p: 2, pb: 1.5 }}>
          <Box>
            <Typography variant={"subtitle2"} noWrap>
              {authData?.email ?? "User"}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ borderStyle: "dashed" }} />

        <Stack sx={{ p: 1 }}>
          <MenuItem onClick={handleNavigate(`${__SITE_API_HOST__}/store`)}>Store</MenuItem>
          <MenuItem onClick={handleNavigate(`${__SITE_API_HOST__}/dashboard`)}>Dashboard</MenuItem>
        </Stack>

        <Divider sx={{ borderStyle: "dashed" }} />

        <MenuItem onClick={onLogout} sx={{ m: 1, fontWeight: "fontWeightBold", color: "error.main" }}>
          Logout
        </MenuItem>
      </CustomPopover>
    </>
  );
};
