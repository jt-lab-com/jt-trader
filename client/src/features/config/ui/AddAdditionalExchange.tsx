import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ExchangeField } from "@packages/types";
import { ChangeEvent, FC, FormEvent, useEffect, useState } from "react";
import { useConfig } from "@/entities/config";
import { useAppDispatch } from "@/shared/lib/hooks/useAppDispatch";
import { useBoolean } from "@/shared/lib/hooks/useBoolean";
import { SvgColor } from "@/shared/ui/svg-color";
import { saveExchangeConfig } from "../model/services/save";

interface AddAdditionalExchangeProps {}

export const AddAdditionalExchange: FC<AddAdditionalExchangeProps> = () => {
  const dispatch = useAppDispatch();
  const modal = useBoolean();
  const {
    exchanges: { additional },
  } = useConfig();

  const [selectedExchange, setSelectedExchange] = useState(additional?.[0]?.name ?? "");
  const [exchangeFields, setExchangeFields] = useState<ExchangeField[]>([]);

  useEffect(() => {
    if (!additional || !additional.length) return;
    setSelectedExchange(additional[0].name);
    setExchangeFields(additional[0].fields);
  }, [additional]);

  if (!additional?.length) return null;

  const handleExchangeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSelectedExchange(e.target.value);
    setExchangeFields(additional?.find((exchange) => exchange.name === e.target.value)?.fields ?? []);
  };

  const createExchangeFieldChangeHandler = (name: string) => (e: ChangeEvent<HTMLInputElement>) => {
    setExchangeFields((fields) => {
      return fields.map((field) => {
        if (field.name !== name) return field;
        return { ...field, value: e.target.value };
      });
    });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch(saveExchangeConfig(exchangeFields as Array<ExchangeField & { value: string }>));
    modal.onFalse();
  };

  return (
    <>
      <Button
        variant={"outlined"}
        size={"small"}
        onClick={modal.onTrue}
        startIcon={<SvgColor size={15} src={"/assets/icons/solid/ic_solar_chart-outline.svg"} />}
      >
        Add Exchange
      </Button>

      <Dialog open={modal.value} onClose={modal.onFalse} maxWidth={"md"} fullWidth>
        <DialogTitle>Add additional exchange</DialogTitle>
        <Box component={"form"} onSubmit={handleSubmit}>
          <DialogContent>
            <Stack sx={{ pt: 1 }} gap={3}>
              <Typography variant={"subtitle2"}>Select exchange</Typography>
              <TextField
                name={"name"}
                label={"Exchange"}
                value={selectedExchange}
                select
                onChange={handleExchangeChange}
              >
                {additional?.map((exchange) => (
                  <MenuItem key={exchange.code} value={exchange.name}>
                    {exchange.name}
                  </MenuItem>
                ))}
              </TextField>
              <Typography variant={"subtitle2"}>Exchange secrets</Typography>
              <Grid container rowSpacing={3} columnSpacing={3}>
                {exchangeFields.map((field) => (
                  <Grid key={field.name} item xs={6}>
                    <TextField
                      value={field.value}
                      label={field.label}
                      fullWidth
                      onChange={createExchangeFieldChangeHandler(field.name)}
                    />
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button variant={"outlined"} onClick={modal.onFalse}>
              Cancel
            </Button>
            <Button type={"submit"} variant={"contained"}>
              Add
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
};
