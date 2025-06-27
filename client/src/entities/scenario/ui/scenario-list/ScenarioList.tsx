import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { Scenario } from "@packages/types";
import { FC, ReactNode, useEffect } from "react";
import { useSelector } from "react-redux";
import { useBoolean } from "@/shared/lib/hooks/useBoolean";
import { Iconify } from "@/shared/ui/iconify";
import { getScenarioList } from "../../model/selectors";
import { SetsTable } from "../sets-table/SetsTable";

interface ScenarioListProps {
  renderScenarioControlButtons: (scenario: Scenario) => ReactNode;
  onRunScenario: (scenarioId: number, sync?: boolean) => void;
  onOpenLogsClicked: (artifactsId: string) => void;
  onOpenReportModalClicked: (artifactsId: string, chartsOnly?: boolean) => void;
}

export const ScenarioList: FC<ScenarioListProps> = (props) => {
  const { renderScenarioControlButtons, onRunScenario, onOpenLogsClicked, onOpenReportModalClicked } = props;

  const list = useSelector(getScenarioList);
  const toRender = [...list].sort((a, b) => b.id - a.id);
  const theme = useTheme();

  return (
    <Stack sx={{ borderTop: `1px solid ${theme.palette.divider}` }}>
      {toRender.map((scenario) => (
        <Scenario
          key={scenario.id}
          data={scenario}
          onRunScenario={onRunScenario}
          onOpenLogsClicked={onOpenLogsClicked}
          onOpenReportModalClicked={onOpenReportModalClicked}
          controlButtons={renderScenarioControlButtons(scenario)}
        />
      ))}
    </Stack>
  );
};

interface ScenarioProps {
  data: Scenario;
  controlButtons: ReactNode;
  onRunScenario: (scenarioId: number, sync?: boolean) => void;
  onOpenLogsClicked: (artifactsId: string) => void;
  onOpenReportModalClicked: (artifactsId: string, chartsOnly?: boolean) => void;
}

const Scenario: FC<ScenarioProps> = (props) => {
  const { data, controlButtons, onRunScenario, onOpenLogsClicked, onOpenReportModalClicked } = props;
  const open = useBoolean();
  const theme = useTheme();

  useEffect(() => {
    const url = new URL(document.location.href);
    const scenarioId = url.searchParams.get("start");

    if (scenarioId && +scenarioId === data.id) {
      open.onTrue();

      onRunScenario(+scenarioId, true);

      url.searchParams.delete("start");
      history.replaceState({}, "", url);
    }
  }, []);

  useEffect(() => {
    const url = new URL(document.location.href);
    const scenarioId = url.searchParams.get("runSync");

    if (scenarioId && +scenarioId === data.id) {
      open.onTrue();

      onRunScenario(+scenarioId, true);

      url.searchParams.delete("runSync");
      history.replaceState({}, "", url);
    }
  }, []);

  return (
    <Collapse
      sx={{
        pb: 3,
        borderBottom: `1px solid ${theme.palette.divider}`,
        bg: "white",
      }}
      in={open.value}
      collapsedSize={100}
    >
      <Box sx={{ py: 3, "&:hover": { cursor: "pointer" } }} onClick={open.onToggle}>
        <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}>
          <Box>
            <Typography variant={"h5"}>{data.name}</Typography>
            <Typography variant={"body2"} color={"text.disabled"}>
              {`${data.symbols.join(", ")} | Start ${data.start} | End ${data.end}`}
            </Typography>
          </Box>
          <IconButton sx={{ width: 30, height: 30 }} size={"small"}>
            <Iconify
              width={20}
              icon={open.value ? "solar:alt-arrow-up-outline" : "solar:alt-arrow-down-outline"}
            />
          </IconButton>
        </Stack>
      </Box>
      <Stack sx={{ pb: 3 }} direction={"row"} justifyContent={"space-between"} alignItems={"center"} gap={2}>
        <Typography variant={"caption"}> {data.args.map((arg) => `${arg.key}=${arg.value}; `)}</Typography>
        <Box sx={{ minWidth: 440 }}>{controlButtons}</Box>
      </Stack>
      <SetsTable
        setList={data.sets}
        onOpenLogs={onOpenLogsClicked}
        onOpenReportModal={onOpenReportModalClicked}
      />
    </Collapse>
  );
};
