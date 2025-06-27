import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeOptions, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { FC, ReactNode, useMemo } from "react";
import { useLayoutSettings } from "@/shared/lib/hooks/useLayoutSettings";
import { createCustomComponents } from "../../../styles/theme/components";
import { customShadows } from "../../../styles/theme/custom-shadows";
import { palette } from "../../../styles/theme/palette";
import { shadows } from "../../../styles/theme/shadows";
import { typography } from "../../../styles/theme/typography";

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: FC<ThemeProviderProps> = (props) => {
  const { children } = props;
  const settings = useLayoutSettings();

  const themeMode = settings.themeMode;

  const memoizedValue = useMemo(
    () => ({
      palette: { ...palette(themeMode) },
      customShadows: { ...customShadows(themeMode) },
      shadows: shadows(themeMode),
      shape: { borderRadius: 8 },
      typography,
      cssVariables: true,
    }),
    [themeMode]
  );

  const theme = createTheme(memoizedValue as ThemeOptions);
  theme.components = createCustomComponents(theme);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};
