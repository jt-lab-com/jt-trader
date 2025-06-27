import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import { StrategyDefinedArgOption } from "@packages/types";
import { FC, Fragment } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Iconify } from "@/shared/ui/iconify";
import { RHFSelect } from "@/shared/ui/rhf-select";
import { RHFTextField } from "@/shared/ui/rhf-textfield";
import { ScenarioSchema, staticScopeSchema } from "../../model/schema/scenario.schema";

interface StaticScopeParamsProps {}

export const StaticScopeParams: FC<StaticScopeParamsProps> = () => {
  const { control } = useFormContext<ScenarioSchema>();

  const { fields, append, remove } = useFieldArray({ control, name: "staticScope" });

  const handleRemoveRow = (index: number) => () => {
    remove(index);
  };

  const handleAddRow = () => {
    append({ key: "", value: "" });
  };

  return (
    <Grid container columnSpacing={2} rowSpacing={2}>
      <Grid item xs={12}>
        <Stack direction={"row"} alignItems={"center"} gap={1}>
          <InputLabel>Static parameters</InputLabel>
          <Stack direction={"row"}>
            <CopyArgsButton />
            <PasteArgsButton />
          </Stack>
        </Stack>
      </Grid>
      {fields?.map((item, index) => (
        <Fragment key={item.id}>
          <Grid item xs={5.5}>
            <RHFTextField
              variant={"outlined"}
              name={`staticScope[${index}].key`}
              label={"Parameter"}
              size={"small"}
            />
          </Grid>
          <Grid item xs={5.5}>
            {item.options ? (
              <RHFSelect
                variant={"outlined"}
                name={`staticScope[${index}].value`}
                label={"Value"}
                size={"small"}
              >
                {item.options.map((arg: StrategyDefinedArgOption) => (
                  <MenuItem key={arg.value} value={arg.value}>
                    {arg.label}
                  </MenuItem>
                ))}
              </RHFSelect>
            ) : (
              <RHFTextField
                variant={"outlined"}
                name={`staticScope[${index}].value`}
                label={"Value"}
                size={"small"}
              />
            )}
          </Grid>
          <Grid item xs={1}>
            <Button
              sx={{ height: "100%", minWidth: "auto", width: "100%" }}
              onClick={handleRemoveRow(index)}
              variant={"soft"}
              size={"small"}
            >
              <Iconify icon={"solar:trash-bin-2-outline"} />
            </Button>
          </Grid>
        </Fragment>
      ))}
      <Grid item xs={12}>
        <Button
          sx={{ height: "100%" }}
          variant={"soft"}
          startIcon={<Iconify icon={"eva:plus-fill"} />}
          onClick={handleAddRow}
          fullWidth
        >
          Add static parameter
        </Button>
      </Grid>
    </Grid>
  );
};

const CopyArgsButton = () => {
  const { getValues } = useFormContext<ScenarioSchema>();

  const handleCopy = async () => {
    const args = getValues("staticScope");
    await navigator.clipboard.writeText(JSON.stringify(args));
  };

  return (
    <Tooltip title={"Copy args"}>
      <IconButton size={"small"} onClick={handleCopy}>
        <Iconify width={15} icon={"solar:copy-linear"} />
      </IconButton>
    </Tooltip>
  );
};

const PasteArgsButton = () => {
  const { setValue } = useFormContext<ScenarioSchema>();

  const handlePaste = async () => {
    try {
      const rawArgs = await navigator.clipboard.readText();
      const args = await staticScopeSchema.validate(JSON.parse(rawArgs));
      setValue("staticScope", args);
    } catch (e) {
      console.error("Error inserting arguments: invalid schema");
    }
  };

  return (
    <Tooltip title={"Paste args"}>
      <IconButton size={"small"} onClick={handlePaste}>
        <Iconify width={15} icon={"solar:copy-bold"} />
      </IconButton>
    </Tooltip>
  );
};
