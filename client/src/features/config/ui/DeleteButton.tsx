import IconButton from "@mui/material/IconButton";
import { FC } from "react";
import { Iconify } from "@/shared/ui/iconify";

interface DeleteButtonProps {
  disabled: boolean;
  onDelete: () => void;
}

export const DeleteButton: FC<DeleteButtonProps> = (props) => {
  return (
    <IconButton disabled={props.disabled} onClick={props.onDelete}>
      <Iconify icon={"solar:trash-bin-2-outline"} />
    </IconButton>
  );
};
