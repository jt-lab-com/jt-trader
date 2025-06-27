import { DatePicker, DatePickerProps } from "@mui/x-date-pickers/DatePicker";
import { Dayjs } from "dayjs";
import { FC } from "react";
import { Controller, useFormContext } from "react-hook-form";

interface RHFDatePickerProps extends DatePickerProps<Dayjs> {
  name: string;
}

export const RHFDatePicker: FC<RHFDatePickerProps> = (props) => {
  const { name, ...rest } = props;
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => <DatePicker inputRef={field.ref} {...field} {...rest} />}
    />
  );
};
