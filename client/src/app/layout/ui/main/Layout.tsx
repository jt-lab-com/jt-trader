import Box from "@mui/material/Box";
import { FC } from "react";
import { Outlet } from "react-router";
import { useConfig } from "@/entities/config";
import { Header } from "./header/Header";

interface LayoutProps {}

export const Layout: FC<LayoutProps> = () => {
  const { engineMode } = useConfig();

  return (
    <Box sx={{ pt: 8 }}>
      <Header engineMode={engineMode} />
      <Outlet />
    </Box>
  );
};
