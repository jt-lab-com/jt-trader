"use client";
import IconButton from "@mui/material/IconButton";
import { FC } from "react";
import { useLayoutSettings } from "@/shared/lib/hooks/useLayoutSettings";
import { SvgColor } from "@/shared/ui/svg-color";

interface ThemeButtonProps {}

export const ThemeButton: FC<ThemeButtonProps> = () => {
  const settings = useLayoutSettings();
  const icon = settings.themeMode === "light" ? "ic-moon.svg" : "ic-sun.svg";

  const handleClick = () => {
    const newTheme = settings.themeMode === "light" ? "dark" : "light";
    settings.onUpdate("themeMode", newTheme);
  };

  return (
    <IconButton onClick={handleClick}>
      <SvgColor src={`/assets/icons/settings/${icon}`} />
    </IconButton>
  );
};
