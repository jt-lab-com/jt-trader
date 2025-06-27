import IconButton from "@mui/material/IconButton";
import { Exchange, ExchangeField } from "@packages/types";
import { FC } from "react";
import { useBoolean } from "@/shared/lib/hooks/useBoolean";
import { Iconify } from "@/shared/ui/iconify";
import { ConfigModal } from "./config-modal/ConfigModal";

interface EditButtonProps {
  exchange: Exchange;
  onSave: (fields: ExchangeField[]) => void;
}

export const EditButton: FC<EditButtonProps> = (props) => {
  const { exchange, onSave } = props;

  const modal = useBoolean();

  return (
    <>
      <IconButton onClick={modal.onTrue}>
        <Iconify icon={"solar:pen-new-square-linear"} />
      </IconButton>

      <ConfigModal
        open={modal.value}
        title={`${exchange.name} config`}
        fields={exchange.fields}
        onSave={onSave}
        onClose={modal.onFalse}
      />
    </>
  );
};
