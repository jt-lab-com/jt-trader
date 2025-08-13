import MenuItem from "@mui/material/MenuItem";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import { ChangeEvent, FC } from "react";
import { ChartPlayerSpeed } from "../../../lib/chart-playback/player";

type SpeedSelectorProps = Omit<TextFieldProps, "onChange"> & {
  chartSpeed: ChartPlayerSpeed;
  onChange: (speed: ChartPlayerSpeed) => void;
};

export const SpeedSelector: FC<SpeedSelectorProps> = (props) => {
  const { chartSpeed, onChange, ...rest } = props;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value as ChartPlayerSpeed);
  };

  return (
    <TextField
      sx={{ minWidth: 120 }}
      label={"Playback speed"}
      select
      value={chartSpeed}
      onChange={handleChange}
      size={"small"}
      {...rest}
    >
      <MenuItem value={ChartPlayerSpeed.x1}>x1</MenuItem>
      <MenuItem value={ChartPlayerSpeed.x2}>x2</MenuItem>
      <MenuItem value={ChartPlayerSpeed.x4}>x4</MenuItem>
    </TextField>
  );
};
