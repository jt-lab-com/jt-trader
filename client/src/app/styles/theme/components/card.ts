import { Theme } from "@mui/material/styles";

export const card = (theme: Theme) => ({
  MuiCard: {
    styleOverrides: {
      root: {
        position: "relative",
        boxShadow: theme.customShadows.card,
        borderRadius: theme.shape.borderRadius * 2,
        zIndex: 0,
      },
    },
  },
  MuiCardHeader: {
    styleOverrides: {
      root: {
        padding: theme.spacing(3, 3, 0),
      },
    },
    defaultProps: {
      titleTypographyProps: { variant: "h6" },
      subheaderTypographyProps: {
        variant: "body2",
        marginTop: theme.spacing(0.5),
      },
    },
  },
  MuiCardContent: {
    styleOverrides: {
      root: {
        padding: theme.spacing(3),
      },
    },
  },
});
