import { alpha, Theme } from "@mui/material/styles";

export const paper = (theme: Theme) => ({
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: "none",
      },
      outlined: {
        borderColor: alpha(theme.palette.grey[500], 0.16),
      },
    },
    defaultProps: {
      elevation: 0,
    },
  },
});
