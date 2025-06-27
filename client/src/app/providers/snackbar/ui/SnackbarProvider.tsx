import IconButton from "@mui/material/IconButton";
import { alpha, styled } from "@mui/material/styles";
import { closeSnackbar, MaterialDesignContent, SnackbarProvider as NotistackProvider } from "notistack";
import { FC, ReactNode, useRef } from "react";
import { Iconify } from "@/shared/ui/iconify";

interface SnackbarProviderProps {
  children: ReactNode;
}

export const SnackbarProvider: FC<SnackbarProviderProps> = (props) => {
  const { children } = props;
  const notistackRef = useRef<any>(null);

  return (
    <NotistackProvider
      ref={notistackRef}
      maxSnack={5}
      preventDuplicate
      autoHideDuration={3000}
      variant="success" // Set default variant
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      iconVariant={{
        info: (
          <StyledIcon color="info">
            <Iconify icon="eva:info-fill" width={24} />
          </StyledIcon>
        ),
        success: (
          <StyledIcon color="success">
            <Iconify icon="eva:checkmark-circle-2-fill" width={24} />
          </StyledIcon>
        ),
        warning: (
          <StyledIcon color="warning">
            <Iconify icon="eva:alert-triangle-fill" width={24} />
          </StyledIcon>
        ),
        error: (
          <StyledIcon color="error">
            <Iconify icon="solar:danger-bold" width={24} />
          </StyledIcon>
        ),
      }}
      Components={{
        default: StyledNotistack,
        info: StyledNotistack,
        success: StyledNotistack,
        warning: StyledNotistack,
        error: StyledNotistack,
      }}
      // with close as default
      action={(snackbarId) => (
        <IconButton size="small" onClick={() => closeSnackbar(snackbarId)} sx={{ p: 0.5 }}>
          <Iconify width={16} icon="mingcute:close-line" />
        </IconButton>
      )}
    >
      {children}
    </NotistackProvider>
  );
};

const StyledNotistack = styled(MaterialDesignContent)(({ theme }) => {
  const lightMode = theme.palette.mode === "light";

  return {
    "& #notistack-snackbar": {
      ...theme.typography.subtitle2,
      padding: 0,
      flexGrow: 1,
    },
    "&.notistack-MuiContent": {
      color: theme.palette.text.primary,
      boxShadow: theme.customShadows.z8,
      borderRadius: theme.shape.borderRadius,
      padding: theme.spacing(0.5, 2, 0.5, 0.5),
      backgroundColor: theme.palette.background.paper,
    },
    "&.notistack-MuiContent-default": {
      padding: theme.spacing(1, 2, 1, 1),
      color: lightMode ? theme.palette.common.white : theme.palette.grey[800],
      backgroundColor: lightMode ? theme.palette.grey[800] : theme.palette.common.white,
    },
  };
});

type StyledIconProps = {
  color: "info" | "success" | "warning" | "error";
};

const StyledIcon = styled("span")<StyledIconProps>(({ color, theme }) => ({
  width: 44,
  height: 44,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginRight: theme.spacing(1.5),
  color: theme.palette[color].main,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette[color].main, 0.16),
}));
