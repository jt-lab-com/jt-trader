import { ButtonProps, buttonClasses } from "@mui/material/Button";
import { alpha, Theme } from "@mui/material/styles";

declare module "@mui/material/Button" {
  interface ButtonPropsVariantOverrides {
    soft: true;
  }
}

const COLORS = ["primary", "secondary", "info", "success", "warning", "error"] as const;

export const button = (theme: Theme) => {
  const isLightMode = theme.palette.mode === "light";

  const generateRootStyles = (props: ButtonProps) => {
    const { color, variant, size } = props;

    const isContained = variant === "contained";
    const isOutlined = variant === "outlined";
    const isText = variant === "text";
    const isSoft = variant === "soft";

    const isSmall = size === "small";
    const isMedium = size === "medium";
    const isLarge = size === "large";

    const isInheritColor = color === "inherit";

    const baseStyles = {
      ...(isInheritColor && {
        ...(isContained && {
          color: isLightMode ? theme.palette.common.white : theme.palette.grey[800],
          backgroundColor: isLightMode ? theme.palette.grey[800] : theme.palette.common.white,
          "&:hover": {
            backgroundColor: isLightMode ? theme.palette.grey[700] : theme.palette.grey[400],
          },
        }),
        ...(isOutlined && {
          color: isLightMode ? theme.palette.grey[800] : theme.palette.common.white,
          borderColor: alpha(theme.palette.grey[500], 0.32),
          "&:hover": {
            backgroundColor: theme.palette.action.hover,
          },
        }),
        ...(isText && {
          "&:hover": {
            backgroundColor: theme.palette.action.hover,
          },
        }),
        ...(isSoft && {
          color: theme.palette.text.primary,
          backgroundColor: alpha(theme.palette.grey[500], 0.08),
          "&:hover": {
            backgroundColor: alpha(theme.palette.grey[500], 0.24),
          },
        }),
      }),
      ...(isOutlined && {
        "&:hover": {
          borderColor: "currentColor",
          boxShadow: "0 0 0 0.5px currentColor",
        },
      }),
    };

    const colorStyles = COLORS.map((variantColor) => {
      if (color === variantColor) {
        return {
          ...(isContained && {
            "&:hover": {
              boxShadow: theme.customShadows[variantColor],
            },
          }),
          ...(isSoft && {
            color: theme.palette[variantColor][isLightMode ? "dark" : "light"],
            backgroundColor: alpha(theme.palette[variantColor].main, 0.16),
            "&:hover": {
              backgroundColor: alpha(theme.palette[variantColor].main, 0.32),
            },
          }),
        };
      }
      return {};
    });

    const disabledStyles = {
      [`&.${buttonClasses.disabled}`]: {
        ...(isSoft && {
          backgroundColor: theme.palette.action.disabledBackground,
        }),
      },
    };

    const sizeStyles = {
      ...(isSmall && {
        height: 30,
        fontSize: 13,
        padding: isText ? "6px 4px" : "6px 8px",
      }),
      ...(isMedium && {
        padding: isText ? "6px 8px" : "6px 12px",
      }),
      ...(isLarge && {
        height: 48,
        fontSize: 15,
        padding: isText ? "6px 10px" : "6px 16px",
      }),
    };

    return [baseStyles, ...colorStyles, disabledStyles, sizeStyles];
  };

  return {
    MuiButton: {
      styleOverrides: {
        root: ({ ownerState }: { ownerState: ButtonProps }) => generateRootStyles(ownerState),
      },
      defaultProps: {
        color: "inherit",
        disableElevation: true,
      },
    },
  };
};
