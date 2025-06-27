import Autocomplete, { AutocompleteProps } from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { Controller, useFormContext } from "react-hook-form";

interface RHFAutoCompleteProps<
  T,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined
> extends Omit<AutocompleteProps<T, Multiple, DisableClearable, FreeSolo>, "renderInput"> {
  name: string;
  label: string;
}

export const RHFAutoComplete = <T, M extends boolean, D extends boolean, F extends boolean>(
  props: RHFAutoCompleteProps<T, M, D, F>
) => {
  const { name, label, options, ...rest } = props;
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Autocomplete
          {...field}
          options={options}
          onInputChange={(event, value) => {
            field.onChange(event ?? { target: { value } });
          }}
          onChange={(e, newValue) => {
            field.onChange({ target: { value: newValue } } ?? null);
          }}
          getOptionLabel={(value) => (typeof value !== "string" ? `${value}` : value)}
          renderInput={(params) => (
            <TextField {...params} label={label} error={!!error} helperText={error ? error.message : ""} />
          )}
          {...rest}
        />
      )}
    />
  );
};
