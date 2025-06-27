import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import InputLabel from "@mui/material/InputLabel";
import { FC, Fragment } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Iconify } from "@/shared/ui/iconify";
import { RHFTextField } from "@/shared/ui/rhf-textfield";

interface DynamicScopeParamsProps {}

export const DynamicScopeParams: FC<DynamicScopeParamsProps> = () => {
  const { control } = useFormContext();

  const { fields, append, remove } = useFieldArray({ control, name: "dynamicScope" });

  const handleRemoveRow = (index: number) => () => {
    remove(index);
  };

  const handleAddRow = () => {
    append({ name: "param", begin: 0, end: 0, step: 1 });
  };

  return (
    <Grid container rowSpacing={2} columnSpacing={2}>
      <Grid item xs={12}>
        <InputLabel>Dynamic parameters</InputLabel>
      </Grid>
      {fields?.map((item, index) => (
        <Fragment key={item.id}>
          <Grid item xs={5}>
            <RHFTextField
              variant={"outlined"}
              name={`dynamicScope[${index}].name`}
              label={"Parameter"}
              size={"small"}
              fullWidth
            />
          </Grid>
          <Grid item xs={2}>
            <RHFTextField
              variant={"outlined"}
              name={`dynamicScope[${index}].begin`}
              label={"Begin"}
              size={"small"}
              fullWidth
            />
          </Grid>
          <Grid item xs={2}>
            <RHFTextField
              variant={"outlined"}
              name={`dynamicScope[${index}].end`}
              label={"End"}
              size={"small"}
              fullWidth
            />
          </Grid>
          <Grid item xs={2}>
            <RHFTextField
              variant={"outlined"}
              name={`dynamicScope[${index}].step`}
              label={"Step"}
              size={"small"}
              fullWidth
            />
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
          Add dynamic parameter
        </Button>
      </Grid>
    </Grid>
  );
};
