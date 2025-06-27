import { LinearProgressProps, linearProgressClasses } from "@mui/material/LinearProgress";
import { Theme, alpha } from "@mui/material/styles";

const COLORS = ["primary", "secondary", "info", "success", "warning", "error"] as const;

export const progress = (theme: Theme) => {
  const getColorStyles = (ownerState: LinearProgressProps) => {
    return COLORS.reduce((styles, color) => {
      if (ownerState.color === color) {
        styles.backgroundColor = alpha(theme.palette[color].main, 0.24);
      }
      return styles;
    }, {} as Record<string, any>);
  };

  const rootStyles = (ownerState: LinearProgressProps) => {
    const isBufferVariant = ownerState.variant === "buffer";

    return {
      borderRadius: 4,
      [`& .${linearProgressClasses.bar}`]: {
        borderRadius: 4,
      },
      ...(isBufferVariant && { backgroundColor: "transparent" }),
      ...getColorStyles(ownerState),
    };
  };

  return {
    MuiLinearProgress: {
      styleOverrides: {
        root: ({ ownerState }: { ownerState: LinearProgressProps }) => rootStyles(ownerState),
      },
    },
  };
};
