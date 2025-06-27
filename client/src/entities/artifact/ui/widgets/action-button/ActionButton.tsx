import LoadingButton from "@mui/lab/LoadingButton";
import { useSnackbar } from "notistack";
import { FC } from "react";
import { useAppDispatch } from "@/shared/lib/hooks/useAppDispatch";
import { useBoolean } from "@/shared/lib/hooks/useBoolean";
import { emitAction } from "../../../model/services/emit-action";
import { ActionButtonData } from "../../../model/types";

interface ActionButtonProps {
  artifactId: string;
  data: ActionButtonData;
}

export const ActionButton: FC<ActionButtonProps> = (props) => {
  const { artifactId, data } = props;
  const dispatch = useAppDispatch();
  const loading = useBoolean();
  const { enqueueSnackbar } = useSnackbar();

  const handleClick = async () => {
    loading.onTrue();
    const result = await dispatch(
      emitAction({ artifacts: artifactId, action: data.action, payload: data.payload })
    );
    loading.onFalse();

    if (result.meta.requestStatus === "rejected") {
      enqueueSnackbar({ message: "Response timed out", variant: "error" });
      return;
    }

    if (result.payload?.message) {
      enqueueSnackbar({
        message: result.payload.message,
        variant: result.payload.error ? "error" : "success",
      });
    }
  };

  return (
    <LoadingButton loading={loading.value} variant={"outlined"} onClick={handleClick}>
      {data.label}
    </LoadingButton>
  );
};
