import TextField, { TextFieldProps } from "@mui/material/TextField";
import { ForwardedRef, forwardRef } from "react";
import { Controller, useFormContext } from "react-hook-form";

type RHFTextFieldProps = TextFieldProps & {
  name: string;
};

export const RHFTextField = forwardRef((props: RHFTextFieldProps, ref: ForwardedRef<HTMLDivElement>) => {
  const { name, helperText, type, ...other } = props;
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          fullWidth
          type={type}
          value={type === "number" && field.value === 0 ? "" : field.value}
          onChange={(event) => {
            if (type === "number") {
              field.onChange(Number(event.target.value));
            } else {
              field.onChange(event.target.value);
            }
          }}
          error={!!error}
          helperText={error ? error?.message : helperText}
          {...other}
          ref={ref}
        />
      )}
    />
  );
});
