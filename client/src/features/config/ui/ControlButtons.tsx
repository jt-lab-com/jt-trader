import Stack from "@mui/material/Stack";
import { Exchange, ExchangeField } from "@packages/types";
import { FC } from "react";
import { useAppDispatch } from "@/shared/lib/hooks/useAppDispatch";
import { saveExchangeConfig } from "../model/services/save";
import { DeleteButton } from "./DeleteButton";
import { EditButton } from "./EditButton";

interface ControlButtonsProps {
  exchange: Exchange;
}

export const ControlButtons: FC<ControlButtonsProps> = (props) => {
  const { exchange } = props;
  const dispatch = useAppDispatch();

  const handleDelete = () => {
    dispatch(saveExchangeConfig(exchange.fields.map((field) => ({ ...field, value: "" }))));
  };

  const handleSave = (fields: ExchangeField[]) => {
    dispatch(saveExchangeConfig(fields as Array<ExchangeField & { value: string }>));
  };

  return (
    <Stack direction={"row"} gap={1}>
      <EditButton exchange={exchange} onSave={handleSave} />
      <DeleteButton disabled={exchange.disabled} onDelete={handleDelete} />
    </Stack>
  );
};
