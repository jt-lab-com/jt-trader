import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { FC, useMemo } from "react";
import { useLogout } from "@/features/auth";
import { EngineMode } from "@/entities/config";
import { UserPopover, useAuth } from "@/entities/user";
import { RoutePath } from "@/shared/const/router";
import { useLayoutSettings } from "@/shared/lib/hooks/useLayoutSettings";
import { usePathname } from "@/shared/lib/hooks/usePathname";
import { RouterLink } from "@/shared/ui/router-link";
import { getMenuItems } from "../../../lib/nav-config";
import { ThemeButton } from "./ThemeButton";

interface HeaderProps {
  engineMode: EngineMode | null;
}

export const Header: FC<HeaderProps> = (props) => {
  const { engineMode } = props;
  const { authData, isGuest } = useAuth();
  const handleLogout = useLogout();
  const { themeMode } = useLayoutSettings();
  const path = usePathname();

  const menuItems = useMemo(() => {
    return getMenuItems(engineMode, authData?.developerAccess);
  }, [engineMode, authData]);

  const renderContent = (
    <>
      <Stack sx={{ flexGrow: 1 }} direction={"row"} justifyContent={"center"} gap={3}>
        {menuItems?.map((item) => (
          <RouterLink
            key={item.path}
            sx={{ "&:hover": { textDecoration: "none", color: "text.secondary" } }}
            href={item.path}
            color={"text.primary"}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {item.icon}
              <Typography sx={{ fontWeight: item.path === path ? 700 : 400 }} variant={"body2"}>
                {item.title}
              </Typography>
            </Box>
          </RouterLink>
        ))}
      </Stack>
      <Box sx={{ flexGrow: 0 }}>
        <Stack direction={"row"} alignItems={"center"} gap={2}>
          <ThemeButton />
          {isGuest ? (
            <Box>
              <Button
                component={RouterLink}
                href={RoutePath.login}
                variant={"outlined"}
                color={"inherit"}
                size={"small"}
              >
                Login
              </Button>
            </Box>
          ) : (
            <UserPopover onLogout={handleLogout} />
          )}
        </Stack>
      </Box>
    </>
  );

  return (
    <AppBar
      sx={{
        background: (theme) => theme.palette.background.default,
        boxShadow: themeMode === "dark" ? "0 0 0 2px #333" : "0 12px 24px -4px rgba(145, 156, 171, 0.2)",
      }}
    >
      <Container>
        <Toolbar variant={"regular"} disableGutters>
          {renderContent}
        </Toolbar>
      </Container>
    </AppBar>
  );
};
