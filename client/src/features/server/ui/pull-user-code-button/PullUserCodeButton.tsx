import LoadingButton from "@mui/lab/LoadingButton";
import { useSnackbar } from "notistack";
import { FC, useState } from "react";
import { useAppDispatch } from "@/shared/lib/hooks/useAppDispatch";
import { Iconify } from "@/shared/ui/iconify";
import { pullUserSourceCode } from "../../model/services/pull-source-code";

interface PullUserCodeButtonProps {}

export const PullUserCodeButton: FC<PullUserCodeButtonProps> = () => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handlePullUserCode = async () => {
    setIsLoading(true);
    const result = await dispatch(pullUserSourceCode());
    setIsLoading(false);

    enqueueSnackbar({
      variant: result.payload?.error ? "error" : "success",
      message: result.payload?.message ?? "",
    });
  };

  return (
    <LoadingButton
      variant={"outlined"}
      loading={isLoading}
      onClick={handlePullUserCode}
      size={"small"}
      startIcon={<Iconify width={18} icon={"eva:github-outline"} />}
    >
      Pull
    </LoadingButton>
  );
};
