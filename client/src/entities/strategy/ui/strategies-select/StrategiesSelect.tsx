import { Typography } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { Strategy } from "@packages/types";
import { FC, SyntheticEvent, useMemo } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useStrategy } from "../../lib/hooks/useStrategy";

interface StrategiesSelectProps {
  name: string;
  mode?: "runtime" | "tester";
}

export const StrategiesSelect: FC<StrategiesSelectProps> = (props) => {
  const { name, mode = "runtime" } = props;
  const { localStrategies, remoteBundleStrategies, remoteAppStrategies } = useStrategy();

  const { control } = useFormContext();

  const options = useMemo(() => {
    let apps = [...remoteAppStrategies];

    if (mode === "runtime") {
      apps = remoteAppStrategies.filter((strategy) => strategy.mode !== "tester");
    }

    return [
      ...apps.map((app) => ({ ...app, id: app.id.toString(), groupLabel: "Bots" })),
      ...remoteBundleStrategies.map((bundle) => ({
        ...bundle,
        id: bundle.id.toString(),
        groupLabel: "Bundles",
      })),
      ...localStrategies.map((strategy) => ({ ...strategy, groupLabel: "Local Files" })),
    ];
  }, [localStrategies, remoteBundleStrategies, remoteAppStrategies, mode]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const handleChange = (_: SyntheticEvent, value: Strategy) => {
          field.onChange(value);
        };

        return (
          <Autocomplete
            {...field}
            options={options}
            getOptionLabel={(option) => option.name ?? ""}
            groupBy={(option) => option.groupLabel}
            onChange={handleChange}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderOption={({ key, ...props }, option) => (
              <Box
                key={`${option.id}-${option.type}-${option.version ?? option.type}-${key}`}
                component={"li"}
                {...props}
              >
                {option.name}
                {option.groupLabel !== "Local Files" && (
                  <Typography sx={{ ml: 0.5 }} variant={"caption"} color={"text.disabled"}>
                    (v{option.version})
                  </Typography>
                )}
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label={"Script"}
                size={"small"}
                error={!!error}
                helperText={error?.message}
                fullWidth
              />
            )}
          />
        );
      }}
    />
  );
};
