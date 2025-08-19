import { yupResolver } from "@hookform/resolvers/yup";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import { Job, JobRuntimeType, SaveJobParams, StrategyDefinedArg } from "@packages/types";
import { FC, useEffect, useMemo } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useConfig } from "@/entities/config";
import { useMarkets } from "@/entities/markets";
import { StrategiesSelect, StrategyContent, useStrategy } from "@/entities/strategy";
import { RHFSelect } from "@/shared/ui/rhf-select";
import { RHFTextField } from "@/shared/ui/rhf-textfield";
import { getAvailableMarketSymbols } from "../../lib/get-available-market-symbols";
import { jobSchema, getJobDefaultValues, defaultArgParam, JobSchema } from "../../model/schema/job.schema";
import { Arguments } from "./Arguments";
import { CopyArgsButton } from "./CopyArgsButton";
import { PasteArgsButton } from "./PasteArgsButton";
import { SymbolsFilter } from "./symbols-filter/SymbolsFilter";

type EditMode = "update" | "copy";

interface EditorModalProps {
  open: boolean;
  onClose: VoidFunction;
  job?: Job | null;
  editMode?: EditMode | null;
  onSave: (job: SaveJobParams) => void;
}

export const EditorModal: FC<EditorModalProps> = (props) => {
  const { open, editMode, job, onClose, onSave } = props;
  const { getStrategyDefinedArgs, fetchStrategies } = useStrategy();
  const {
    exchanges: { main: exchangeList },
  } = useConfig();

  const methods = useForm<JobSchema>({
    resolver: yupResolver(jobSchema),
    defaultValues: getJobDefaultValues(job),
  });

  const { handleSubmit, setValue, control, clearErrors, reset } = methods;
  const selectedStrategy = useWatch({ name: "selectedStrategy", control });
  const exchange = useWatch({ name: "exchange", control });
  const marketType = useWatch({ name: "marketType", control });
  const markets = useMarkets(exchange, marketType);

  const definedArgs = selectedStrategy
    ? getStrategyDefinedArgs(selectedStrategy.id, selectedStrategy.name, selectedStrategy.type)
    : null;
  const definedSymbols = definedArgs?.find((arg: StrategyDefinedArg) => arg.key === "symbols");

  useEffect(() => {
    clearErrors();
    reset(getJobDefaultValues(job, editMode === "copy"));

    if (open) fetchStrategies();
  }, [open, job, editMode]);

  useEffect(() => {
    if (!selectedStrategy) return;

    if (job && job.strategy.id === selectedStrategy.id) {
      const jobSymbols =
        job.args
          .find((arg) => arg.key === "symbols")
          ?.value?.split(",")
          .map((symbol) => symbol.trim().toUpperCase()) ?? [];

      if (markets) {
        const availableSymbols = getAvailableMarketSymbols(jobSymbols, markets, {
          search: "",
          minVolume: definedSymbols?.filters?.volume?.min ?? 0,
          minLeverage: definedSymbols?.filters?.leverage?.min ?? 0,
        });

        setValue("symbols", availableSymbols);
      } else {
        setValue("symbols", jobSymbols);
      }

      const args = job.args.filter((arg) => arg.key !== "symbols");

      setValue("args", args);
      return;
    }

    const symbols =
      definedSymbols?.defaultValue?.split(",").map((symbol: string) => symbol.trim().toUpperCase()) ?? [];

    if (markets) {
      const availableSymbols = getAvailableMarketSymbols(symbols, markets, {
        search: "",
        minVolume: definedSymbols?.filters?.volume?.min ?? 0,
        minLeverage: definedSymbols?.filters?.leverage?.min ?? 0,
      });

      setValue("symbols", availableSymbols);
    } else {
      setValue("symbols", symbols);
    }

    setValue(
      "args",
      definedArgs
        ?.filter((arg) => arg.key !== "symbols")
        .filter((arg) => arg.mode !== "tester")
        .map(({ key, defaultValue, options }) => ({
          key,
          value: defaultValue?.toString() ?? "",
          options,
        })) ?? [{ ...defaultArgParam }]
    );
  }, [selectedStrategy, exchange, definedArgs, definedSymbols, markets]);

  const onSubmit = handleSubmit(
    (data: JobSchema) => {
      const { args, runtimeType, jobName, prefix, id, exchange, symbols, selectedStrategy, marketType } =
        data;

      args?.push({ key: "symbols", value: symbols?.join(",") });

      onSave({
        id: id ?? undefined,
        prefix,
        name: jobName,
        strategy: selectedStrategy,
        exchange,
        marketType,
        args: args ?? [],
        runtimeType: runtimeType as JobRuntimeType,
      });

      onClose?.();
    },
    (errors) => console.log(errors)
  );

  const exchangeOptions = useMemo(
    () =>
      [...exchangeList].sort((a, b) => {
        if (a.connected && !b.connected) return -1;
        if (!a.connected && b.connected) return 1;
        return 0;
      }),
    [exchangeList]
  );

  const title = editMode
    ? editMode === "copy"
      ? `Copy ${job?.name}`
      : `Update ${job?.name}`
    : "Create runtime";
  const confirmActionText = editMode ? (editMode === "copy" ? "Copy" : "Update") : "Save";

  return (
    <Dialog open={open} onClose={onClose} maxWidth={"md"} fullWidth>
      <DialogTitle textAlign={"center"} variant={"h5"}>
        {title}
      </DialogTitle>
      <DialogContent>
        <FormProvider {...methods}>
          <Stack gap={5}>
            <Grid container rowSpacing={3} columnSpacing={3}>
              <Grid item xs={6}>
                <RHFTextField
                  id={"job-prefix"}
                  name={"prefix"}
                  fullWidth
                  label={"Prefix"}
                  variant={"filled"}
                  size={"small"}
                />
              </Grid>
              <Grid item xs={6}>
                <RHFTextField
                  id={"job-name"}
                  name={"jobName"}
                  fullWidth
                  label={"Name"}
                  variant={"filled"}
                  size={"small"}
                />
              </Grid>
              <Grid item xs={3}>
                <RHFSelect name={"exchange"} label={"Exchange"} size={"small"} variant={"outlined"}>
                  {exchangeOptions.map((exchange) => (
                    <MenuItem key={exchange.code} disabled={!exchange.connected} value={exchange.code}>
                      {exchange.name}
                    </MenuItem>
                  ))}
                </RHFSelect>
              </Grid>
              <Grid item xs={3}>
                <RHFSelect name={"marketType"} label={"Market type"} size={"small"} variant={"outlined"}>
                  <MenuItem value={"swap"}>swap</MenuItem>
                  <MenuItem value={"spot"}>spot</MenuItem>
                </RHFSelect>
              </Grid>
              <Grid item xs={3}>
                <StrategiesSelect name={"selectedStrategy"} />
              </Grid>
              <Grid item xs={3}>
                <RHFSelect name={"runtimeType"} label={"Runtime"} size={"small"} variant={"outlined"}>
                  <MenuItem value={"market"}>market</MenuItem>
                  <MenuItem value={"system"}>system</MenuItem>
                </RHFSelect>
              </Grid>
              <Grid item xs={12}>
                <SymbolsFilter
                  markets={markets}
                  definedFilters={definedSymbols?.filters}
                  loading={!!exchange && !markets?.length}
                />
              </Grid>
            </Grid>

            <Grid container>
              <Stack sx={{ mb: 2 }} direction={"row"} alignItems={"center"} gap={1}>
                <InputLabel>Parameters</InputLabel>
                <Stack direction={"row"} gap={0}>
                  <CopyArgsButton />
                  <PasteArgsButton />
                </Stack>
              </Stack>
              <Grid item xs={12}>
                <Arguments />
              </Grid>
            </Grid>

            {selectedStrategy?.type === "local" && (
              <Grid container>
                <Grid item xs={12}>
                  <StrategyContent strategyPath={selectedStrategy.path} />
                </Grid>
              </Grid>
            )}
          </Stack>
        </FormProvider>
      </DialogContent>
      <Divider sx={{ borderStyle: "dashed", mt: 3 }} />
      <DialogActions sx={{ justifyContent: "space-between", py: 3 }}>
        <Stack sx={{ width: "100%" }} direction={"row"} gap={1.5}>
          <Box sx={{ flexGrow: 1 }}>
            <Button variant={"outlined"} fullWidth size={"large"} onClick={onClose}>
              Cancel
            </Button>
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Button variant={"contained"} fullWidth size={"large"} onClick={onSubmit}>
              {confirmActionText}
            </Button>
          </Box>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};
