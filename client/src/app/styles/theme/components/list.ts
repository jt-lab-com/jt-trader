import { Theme } from "@mui/material/styles";

export const list = (theme: Theme) => {
  return {
    MuiListItemText: {
      styleOverrides: {
        root: {
          margin: 0,
        },
        multiline: {
          margin: 0,
        },
      },
      defaultProps: {
        primaryTypographyProps: {
          typography: "subtitle2",
        },
        secondaryTypographyProps: {
          component: "span",
        },
      },
    },
    MuiListItemAvatar: {
      styleOverrides: {
        root: {
          minWidth: "auto",
          marginRight: theme.spacing(2),
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: "inherit",
          minWidth: "auto",
          marginRight: theme.spacing(2),
        },
      },
    },
  };
};
