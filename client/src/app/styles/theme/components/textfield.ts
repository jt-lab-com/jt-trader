import { filledInputClasses } from "@mui/material/FilledInput";
import { inputBaseClasses } from "@mui/material/InputBase";
import { inputLabelClasses } from "@mui/material/InputLabel";
import { outlinedInputClasses } from "@mui/material/OutlinedInput";
import { alpha, Theme } from "@mui/material/styles";

export const textField = (theme: Theme) => {
  const color = {
    focused: theme.palette.text.primary,
    active: theme.palette.text.secondary,
    placeholder: theme.palette.text.disabled,
    error: theme.palette.error.main,
    disabledBackground: theme.palette.action.disabledBackground,
    grey500: alpha(theme.palette.grey[500], 0.32),
    grey500Light: alpha(theme.palette.grey[500], 0.2),
  };

  const font = {
    label: theme.typography.body1,
    value: theme.typography.body2,
  };

  const transitions = theme.transitions.create(["border-color"], {
    duration: theme.transitions.duration.shortest,
  });

  const filledBackground = (opacity: number) => alpha(theme.palette.grey[500], opacity);
  const errorBackground = (opacity: number) => alpha(theme.palette.error.main, opacity);

  return {
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          marginTop: theme.spacing(1),
        },
      },
    },

    MuiFormLabel: {
      styleOverrides: {
        root: {
          ...font.value,
          color: color.placeholder,
          [`&.${inputLabelClasses.shrink}`]: {
            ...font.label,
            fontWeight: 600,
            color: color.active,
            [`&.${inputLabelClasses.focused}`]: { color: color.focused },
            [`&.${inputLabelClasses.error}`]: { color: color.error },
            [`&.${inputLabelClasses.disabled}`]: { color: color.placeholder },
            [`&.${inputLabelClasses.filled}`]: {
              transform: "translate(12px, 6px) scale(0.75)",
            },
          },
        },
      },
    },

    MuiInputBase: {
      styleOverrides: {
        root: {
          [`&.${inputBaseClasses.disabled}`]: {
            "& svg": { color: color.placeholder },
          },
        },
        input: {
          ...font.value,
          "&::placeholder": {
            opacity: 1,
            color: color.placeholder,
          },
        },
      },
    },

    MuiInput: {
      styleOverrides: {
        underline: {
          "&:before": { borderBottomColor: color.grey500 },
          "&:after": { borderBottomColor: color.focused },
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          [`&.${outlinedInputClasses.focused} .${outlinedInputClasses.notchedOutline}`]: {
            borderColor: color.focused,
          },
          [`&.${outlinedInputClasses.error} .${outlinedInputClasses.notchedOutline}`]: {
            borderColor: color.error,
          },
          [`&.${outlinedInputClasses.disabled} .${outlinedInputClasses.notchedOutline}`]: {
            borderColor: color.disabledBackground,
          },
        },
        notchedOutline: {
          borderColor: color.grey500Light,
          transition: transitions,
        },
      },
    },

    MuiFilledInput: {
      styleOverrides: {
        root: {
          borderRadius: theme.shape.borderRadius,
          backgroundColor: filledBackground(0.08),
          "&:hover": { backgroundColor: filledBackground(0.16) },
          [`&.${filledInputClasses.focused}`]: { backgroundColor: filledBackground(0.16) },
          [`&.${filledInputClasses.error}`]: {
            backgroundColor: errorBackground(0.08),
            [`&.${filledInputClasses.focused}`]: { backgroundColor: errorBackground(0.16) },
          },
          [`&.${filledInputClasses.disabled}`]: {
            backgroundColor: color.disabledBackground,
          },
        },
      },
      defaultProps: {
        disableUnderline: true,
      },
    },
  };
};
