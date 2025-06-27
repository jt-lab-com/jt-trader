import { listClasses } from "@mui/material/List";
import { Theme } from "@mui/material/styles";

export const popover = (theme: Theme) => {
  return {
    MuiPopover: {
      styleOverrides: {
        paper: {
          padding: theme.spacing(0.5),
          boxShadow: theme.customShadows.dropdown,
          borderRadius: theme.shape.borderRadius * 1.25,
          [`& .${listClasses.root}`]: {
            paddingTop: 0,
            paddingBottom: 0,
          },
        },
      },
    },
  };
};
