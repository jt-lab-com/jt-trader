import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import { StrategyDefinedArgOption } from "@packages/types";
import { FC, Fragment } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Iconify } from "@/shared/ui/iconify";
import { RHFSelect } from "@/shared/ui/rhf-select";
import { RHFTextField } from "@/shared/ui/rhf-textfield";
import { JobSchema } from "../../model/schema/job.schema";

interface ArgumentsProps {}

export const Arguments: FC<ArgumentsProps> = () => {
  const { control } = useFormContext<JobSchema>();

  const { fields, append, remove } = useFieldArray({ control, name: "args" });

  const handleRemoveArg = (index: number) => () => {
    remove(index);
  };

  const handleAddArg = () => {
    append({ key: "", value: "" });
  };

  return (
    <>
      <Grid container columnSpacing={2} rowSpacing={2}>
        {fields.map((arg, index) => (
          <Fragment key={arg.id}>
            <Grid item xs={5.5}>
              <RHFTextField
                variant={"outlined"}
                name={`args[${index}].key`}
                label={"Parameter"}
                size={"small"}
                fullWidth
              />
            </Grid>
            <Grid item xs={5.5}>
              {arg.options ? (
                <RHFSelect variant={"outlined"} name={`args[${index}].value`} label={"Value"} size={"small"}>
                  {arg.options.map((arg: StrategyDefinedArgOption) => (
                    <MenuItem key={arg.value} value={arg.value}>
                      {arg.label}
                    </MenuItem>
                  ))}
                </RHFSelect>
              ) : (
                <RHFTextField
                  variant={"outlined"}
                  name={`args[${index}].value`}
                  label={"Value"}
                  size={"small"}
                />
              )}
            </Grid>
            <Grid item xs={1}>
              <Button
                sx={{ height: "100%", minWidth: "auto", width: "100%" }}
                onClick={handleRemoveArg(index)}
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
            onClick={handleAddArg}
            fullWidth
          >
            Add parameter
          </Button>
        </Grid>
      </Grid>
    </>
  );
};
