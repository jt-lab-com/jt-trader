import Button from "@mui/material/Button";
import { useSnackbar } from "notistack";
import { FC } from "react";
import { useAppDispatch } from "@/shared/lib/hooks/useAppDispatch";
import { useBoolean } from "@/shared/lib/hooks/useBoolean";
import { Iconify } from "@/shared/ui/iconify";
import { invalidateCache } from "../../model/services/invalidate-cache";

interface InvalidateCacheButtonProps {}

export const InvalidateCacheButton: FC<InvalidateCacheButtonProps> = () => {
  const dispatch = useAppDispatch();
  const loading = useBoolean();
  const { enqueueSnackbar } = useSnackbar();

  const handleInvalidateCache = async () => {
    loading.onTrue();
    const result = await dispatch(invalidateCache());

    if (result.meta.requestStatus === "rejected") {
      enqueueSnackbar({ message: "Error clearing cache", variant: "error" });
    } else {
      enqueueSnackbar({ message: "Cache cleared", variant: "success" });
    }

    loading.onFalse();
  };

  return (
    <Button
      color={"warning"}
      variant={"outlined"}
      startIcon={<Iconify width={15} icon={"solar:refresh-bold"} />}
      size={"small"}
      onClick={handleInvalidateCache}
    >
      Invalidate Cache
    </Button>
  );
};
