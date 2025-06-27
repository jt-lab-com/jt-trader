import { autocompleteClasses } from "@mui/material/Autocomplete";
import { alpha, Theme } from "@mui/material/styles";
import { svgIconClasses } from "@mui/material/SvgIcon";
import { ArrowDownIcon } from "../icons";
import { menuStyles } from "./menu";

export const autocomplete = (theme: Theme) => {
  return {
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          [`& span.${autocompleteClasses.tag}`]: {
            ...theme.typography.subtitle2,
            height: 24,
            minWidth: 24,
            lineHeight: "24px",
            textAlign: "center",
            padding: theme.spacing(0, 0.75),
            color: theme.palette.text.secondary,
            borderRadius: theme.shape.borderRadius,
            backgroundColor: alpha(theme.palette.grey[500], 0.16),
          },
        },
        paper: {
          padding: theme.spacing(0.5),
          boxShadow: theme.customShadows.dropdown,
          borderRadius: theme.shape.borderRadius * 1.25,
        },
        listbox: {
          padding: 0,
          [`& .${autocompleteClasses.option}`]: {
            ...menuStyles(theme),
          },
        },
        endAdornment: {
          [`& .${svgIconClasses.root}`]: {
            width: 18,
            height: 18,
          },
        },
      },
      defaultProps: {
        popupIcon: <ArrowDownIcon />,
      },
    },
  };
};
