import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import FormControl, { FormControlProps } from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { Theme, SxProps } from "@mui/material/styles";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import { FC, ReactNode } from "react";
import { Controller, useFormContext } from "react-hook-form";

type RHFSelectProps = TextFieldProps & {
  name: string;
  native?: boolean;
  maxHeight?: boolean | number;
  children: ReactNode;
  PaperPropsSx?: SxProps<Theme>;
};

export const RHFSelect: FC<RHFSelectProps> = (props) => {
  const { name, native, maxHeight = 220, helperText, children, PaperPropsSx, ...other } = props;

  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          select
          fullWidth
          SelectProps={{
            native,
            MenuProps: {
              PaperProps: {
                sx: {
                  ...(!native && {
                    maxHeight: typeof maxHeight === "number" ? maxHeight : "unset",
                  }),
                  ...PaperPropsSx,
                },
              },
            },
            // sx: { textTransform: 'capitalize' },
          }}
          error={!!error}
          helperText={error ? error?.message : helperText}
          {...other}
        >
          {children}
        </TextField>
      )}
    />
  );
};

type RHFMultiSelectProps = FormControlProps & {
  name: string;
  label?: string;
  chip?: boolean;
  checkbox?: boolean;
  placeholder?: string;
  helperText?: ReactNode;
  options: SelectOption[];
};

interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export const RHFMultiSelect: FC<RHFMultiSelectProps> = (props) => {
  const { name, chip, label, options, checkbox, placeholder, helperText, ...other } = props;

  const { control } = useFormContext();

  const renderValues = (selectedIds: string[]) => {
    const selectedItems = options.filter((item) => selectedIds.includes(item.value));

    if (!selectedItems.length && placeholder) {
      return <Box sx={{ color: "text.disabled" }}>{placeholder}</Box>;
    }

    if (chip) {
      return (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {selectedItems.map((item) => (
            <Chip key={item.value} size="small" label={item.label} />
          ))}
        </Box>
      );
    }

    return selectedItems.map((item) => item.label).join(", ");
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormControl error={!!error} {...other}>
          {label && <InputLabel id={name}> {label} </InputLabel>}

          <Select
            {...field}
            multiple
            displayEmpty={!!placeholder}
            id={`multiple-${name}`}
            labelId={name}
            label={label}
            renderValue={renderValues}
          >
            {options.map((option) => {
              const selected = field.value.includes(option.value);

              return (
                <MenuItem key={option.value} value={option.value} disabled={option.disabled}>
                  {checkbox && <Checkbox size="small" disableRipple checked={selected} />}

                  {option.label}
                </MenuItem>
              );
            })}
          </Select>

          {(!!error || helperText) && (
            <FormHelperText error={!!error}>{error ? error?.message : helperText}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
};
