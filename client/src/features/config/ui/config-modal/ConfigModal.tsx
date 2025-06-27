import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import Switch from "@mui/material/Switch";
import { ExchangeField } from "@packages/types";
import { ChangeEvent, FC, useEffect, useState } from "react";
import { validate } from "../../lib/validate";
import { EditableInput } from "./EditableInput";

interface ConfigModalProps {
  open: boolean;
  title: string;
  fields: ExchangeField[];
  onSave: (fields: ExchangeField[]) => void;
  onClose: VoidFunction;
}

export const ConfigModal: FC<ConfigModalProps> = (props) => {
  const { open, title, onSave, onClose, fields } = props;

  const [inputFields, setInputFields] = useState<(ExchangeField & { isDirty: boolean; error: boolean })[]>(
    []
  );

  useEffect(() => {
    setInputFields(fields.map((field) => ({ ...field, isDirty: false, error: false })));
  }, [fields]);

  const changeTextField = (fieldName: string) => (value: string) => {
    setInputFields((prev) =>
      prev.map((field) => {
        if (field.name === fieldName) {
          field.value = value;
          field.isDirty = true;
          field.error = false;
        }
        return field;
      })
    );
  };

  const changeBooleanField = (fieldName: string) => (e: ChangeEvent<HTMLInputElement>, checked: boolean) => {
    setInputFields((prev) =>
      prev.map((field) => {
        if (field.name === fieldName) {
          field.value = checked;
          field.isDirty = true;
        }
        return field;
      })
    );
  };

  const handleSave = () => {
    const fields = inputFields.filter((field) => field.isDirty);
    const { valid, errors } = validate(fields);

    if (!valid) {
      setInputFields((prev) =>
        prev.map((field) => {
          if (errors[field.name]) {
            field.error = true;
          }

          return field;
        })
      );

      return;
    }

    onSave(fields);
    onClose();
  };

  const handleClose = () => {
    setInputFields(fields.map((field) => ({ ...field, isDirty: false, error: false })));
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth={"md"} fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Grid sx={{ pt: 1 }} container rowSpacing={3} columnSpacing={3}>
          {inputFields.map((field) => (
            <Grid key={field.name} item xs={6}>
              {field.type === "string" ? (
                <EditableInput
                  error={field.error}
                  label={field.label}
                  value={field.value as string}
                  onChange={changeTextField(field.name)}
                />
              ) : (
                <Switch checked={field.value as boolean} onChange={changeBooleanField(field.name)} />
              )}
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant={"contained"} onClick={handleSave}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};
