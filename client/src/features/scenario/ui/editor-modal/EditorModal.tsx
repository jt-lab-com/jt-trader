import { yupResolver } from "@hookform/resolvers/yup";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import { CreateScenarioParams, Scenario } from "@packages/types";
import { FC, useEffect } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useConfig } from "@/entities/config";
import { StrategiesSelect, useStrategy } from "@/entities/strategy";
import { RHFAutoComplete } from "@/shared/ui/rhf-autocomplete";
import { RHFSelect } from "@/shared/ui/rhf-select";
import { RHFSwitch } from "@/shared/ui/rhf-switch";
import { useAutoComplete } from "../../lib/hooks/useAutoComplete";
import { getDefaultValues, defaultStaticParam } from "../../model/schema/default-values";
import { scenarioSchema, ScenarioSchema, timeframes } from "../../model/schema/scenario.schema";
import { prepareApiPayload } from "../../model/services/prepare-api-payload";
import { DynamicScopeParams } from "./DynamicScopeParams";
import { StaticScopeParams } from "./StaticScopeParams";

type EditMode = "update" | "copy";

interface EditorModalProps {
  open: boolean;
  scenario?: Scenario;
  editMode?: EditMode | null;
  onSave: (scenario: CreateScenarioParams) => void;
  onClose: VoidFunction;
}

export const EditorModal: FC<EditorModalProps> = (props) => {
  const { open, editMode, scenario, onSave, onClose } = props;
  const { fetchStrategies, getStrategyDefinedArgs } = useStrategy();
  const { exchangeList, testerDefaults } = useConfig();
  const { completeOptions, updateAutoComplete } = useAutoComplete();

  const methods = useForm<ScenarioSchema>({
    resolver: yupResolver(scenarioSchema),
    defaultValues: getDefaultValues(scenario, testerDefaults),
  });

  const { handleSubmit, control, setValue, reset } = methods;

  const selectedStrategy = useWatch({ name: "selectedStrategy", control });
  const withOptimizer = useWatch({ name: "withOptimizer", control });

  const onSubmit = handleSubmit(
    (data: ScenarioSchema) => {
      const { startTime, endTime, scenarioName, symbols, spread, takerFee, makerFee, leverage } = data;

      onSave(prepareApiPayload(data));

      updateAutoComplete({
        startTime,
        endTime,
        scenarioName,
        symbols,
        spread,
        takerFee,
        makerFee,
        leverage,
      });

      onClose();
    },
    (error) => console.log(error)
  );

  const handleClose = () => {
    if (scenario) {
      reset(getDefaultValues(scenario, testerDefaults), { keepDefaultValues: false, keepDirty: false });
    }

    onClose();
  };

  useEffect(() => {
    if (testerDefaults) {
      reset(getDefaultValues(scenario, testerDefaults), { keepDefaultValues: false, keepDirty: false });
    }
  }, [testerDefaults]);

  useEffect(() => {
    if (!open || editMode !== "copy" || !scenario) return;

    const { name } = scenario;

    setValue("scenarioName", `${name} (copy)`);
  }, [open, editMode, scenario]);

  useEffect(() => {
    if (!open || !selectedStrategy) return;

    fetchStrategies();

    if (scenario && scenario.strategy.id === selectedStrategy.id) {
      const staticArgs = scenario.args.filter(
        (arg) => !scenario.dynamicArgs.find((dynamicArg) => dynamicArg[0] === arg.key)
      );

      setValue("staticScope", staticArgs);
      return;
    }

    const { id, name, type } = selectedStrategy;
    setValue("scenarioName", name.replace(".ts", ""));

    const definedArgs = getStrategyDefinedArgs(id, name, type);

    if (!definedArgs) {
      setValue("staticScope", [{ ...defaultStaticParam }]);
      return;
    }

    const symbols = definedArgs.find((arg) => arg.key === "symbols" && arg.mode !== "runtime");

    if (symbols?.defaultValue) {
      setValue("symbols", symbols.defaultValue);
    }

    setValue(
      "staticScope",
      definedArgs
        .filter((arg) => arg.mode !== "runtime")
        .filter((arg) => arg.key !== "symbols")
        .map((arg) => ({
          key: arg.key,
          value: arg.defaultValue ?? "",
          ...(arg.options && { options: arg.options }),
        }))
    );
  }, [selectedStrategy, open]);

  const title = editMode ? (editMode === "copy" ? "Copy" : "Edit") : "New";
  const confirmActionText = editMode ? (editMode === "copy" ? "Copy" : "Update") : "Save";

  const settings = [
    { name: "spread", label: "Spread", options: completeOptions.spread },
    { name: "startTime", label: "Start time", options: completeOptions.startTime },
    { name: "endTime", label: "End time", options: completeOptions.endTime },
    { name: "makerFee", label: "Maker fee", options: completeOptions.makerFee },
    { name: "takerFee", label: "Taker fee", options: completeOptions.takerFee },
    { name: "leverage", label: "Leverage", options: completeOptions.leverage },
    { name: "balance", label: "Balance", options: completeOptions.balance },
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth={"md"} fullWidth>
      <DialogTitle variant={"h5"} textAlign={"center"}>
        {title} {scenario ? scenario.name : "scenario"}
      </DialogTitle>
      <DialogContent>
        <FormProvider {...methods}>
          <Stack gap={5}>
            <Grid sx={{ pt: 1 }} container columnSpacing={3} rowSpacing={3}>
              <Grid item xs={4}>
                <RHFAutoComplete
                  name={"scenarioName"}
                  label={"Name"}
                  size={"small"}
                  disableClearable
                  freeSolo
                  options={completeOptions.scenarioName}
                />
              </Grid>
              <Grid item xs={4}>
                <StrategiesSelect name={"selectedStrategy"} mode={"tester"} />
              </Grid>
              <Grid item xs={12}>
                <RHFAutoComplete
                  name={"symbols"}
                  label={"Symbols (comma separated)"}
                  size={"small"}
                  freeSolo
                  options={completeOptions.symbols}
                />
              </Grid>
              {settings.map((field) => (
                <Grid key={field.name} item xs={4}>
                  <RHFAutoComplete
                    name={field.name}
                    label={field.label}
                    size={"small"}
                    disableClearable
                    freeSolo
                    options={field.options}
                  />
                </Grid>
              ))}
              <Grid item xs={4}>
                <RHFSelect variant={"outlined"} name={"exchange"} size={"small"} label={"Exchange"}>
                  {exchangeList.map((exchange) => (
                    <MenuItem key={exchange.code} value={exchange.code}>
                      {exchange.name}
                    </MenuItem>
                  ))}
                </RHFSelect>
              </Grid>
              <Grid item xs={4}>
                <RHFSelect variant={"outlined"} name={"timeframe"} size={"small"} label={"Timeframe"}>
                  {timeframes.map(({ value, title }) => (
                    <MenuItem key={value} value={value}>
                      {title}
                    </MenuItem>
                  ))}
                </RHFSelect>
              </Grid>
              <Grid item xs={4}>
                <RHFSwitch name={"hedgeMode"} label={"Hedge mode"} />
              </Grid>
              <Grid item xs={4}>
                <RHFSwitch name={"withOptimizer"} label={"Optimization"} />
              </Grid>
            </Grid>

            <StaticScopeParams />
            {withOptimizer && <DynamicScopeParams />}
          </Stack>
        </FormProvider>
      </DialogContent>
      <Divider sx={{ borderStyle: "dashed", mt: 3 }} />
      <DialogActions sx={{ justifyContent: "space-between", py: 3 }}>
        <Stack sx={{ width: "100%" }} direction={"row"} gap={1.5}>
          <Box sx={{ flexGrow: 1 }}>
            <Button variant={"outlined"} fullWidth size={"large"} onClick={handleClose}>
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
