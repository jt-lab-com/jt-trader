import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { ChangeEvent, FC, useEffect, useRef, useState } from "react";
import { useBoolean } from "@/shared/lib/hooks/useBoolean";
import { Iconify } from "@/shared/ui/iconify";

interface EditableInputProps {
  error: boolean;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const EditableInput: FC<EditableInputProps> = (props) => {
  const { label, value: initialValue, error, onChange } = props;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState("");
  const edit = useBoolean();

  useEffect(() => {
    if (!initialValue.length) {
      edit.onTrue();
    }
  }, [initialValue]);

  useEffect(() => {
    if (!edit.value) {
      setValue(initialValue);
    } else {
      inputRef.current?.focus();
    }
  }, [edit.value]);

  const handleEdit = () => {
    edit.onTrue();
    setValue("");
    onChange("");
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setValue(e.target.value);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <TextField
        inputRef={inputRef}
        label={label}
        error={error}
        value={edit.value ? value : initialValue}
        placeholder={!edit.value ? initialValue : ""}
        disabled={!edit.value}
        onChange={handleChange}
        fullWidth
        InputProps={{
          endAdornment: edit.value ? null : (
            <InputAdornment position={"end"}>
              <IconButton onClick={handleEdit}>
                <Iconify icon={"solar:pen-linear"} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};
