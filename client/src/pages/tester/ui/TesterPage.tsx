import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Scenario } from "@packages/types";
import { FC, useEffect, useRef, useState } from "react";
import {
  CreateScenarioButton,
  ScenarioControlButtons,
  StopAllScenariosButton,
  runScenario,
} from "@/features/scenario";
import { ReportModal } from "@/entities/artifact";
import { LogProcess, LogsPanel, LogsPanelRef, logsActions } from "@/entities/log";
import { ScenarioList, useScenario, PrepareDataProgress } from "@/entities/scenario";
import { useAppDispatch } from "@/shared/lib/hooks/useAppDispatch";
import { useBoolean } from "@/shared/lib/hooks/useBoolean";
import { Page } from "@/shared/ui/page";

interface TesterPageProps {
  title: string;
}

const TesterPage: FC<TesterPageProps> = (props) => {
  const { title } = props;
  const dispatch = useAppDispatch();
  const logsPanelRef = useRef<LogsPanelRef | null>(null);
  const { scenarioList } = useScenario();
  const [processes, setProcesses] = useState<LogProcess[]>([]);
  const [modalArtifactsId, setModalArtifactsId] = useState<string>();
  const reportModal = useBoolean();

  useEffect(() => {
    const processes: LogProcess[] = [];

    scenarioList.forEach((scenario) => {
      scenario.sets.forEach((set) => {
        processes.push({
          id: set.id,
          name: `${scenario.name} | ${set.args[0].key} = ${set.args[0].value}`,
          artifacts: set.artifacts,
          strategy: scenario.strategy.name,
        });
      });
    });

    setProcesses(processes);
  }, [scenarioList]);

  const handleOpenLogs = (artifactsId: string) => {
    dispatch(logsActions.setProcessFilter(artifactsId));
    logsPanelRef.current?.setActive(true);
  };

  const handleOpenReportModal = (artifactsId: string) => {
    setModalArtifactsId(artifactsId);
    reportModal.onTrue();
  };

  const handleCloseReportModal = () => {
    setModalArtifactsId(undefined);
    reportModal.onFalse();
  };

  return (
    <>
      <Page title={title}>
        <Stack sx={{ px: 1 }} gap={3}>
          <Box component={Stack} direction={"row"} justifyContent={"flex-end"} gap={1.5}>
            <CreateScenarioButton />
            <StopAllScenariosButton />
          </Box>
          <ScenarioList
            renderScenarioControlButtons={(scenario: Scenario) => (
              <ScenarioControlButtons scenario={scenario} />
            )}
            onRunScenario={runScenario}
            onOpenLogsClicked={handleOpenLogs}
            onOpenReportModalClicked={handleOpenReportModal}
          />
          <LogsPanel
            onRef={(ref) => (logsPanelRef.current = ref)}
            initialArtifactsId={processes[0]?.artifacts}
            processes={processes}
          />
          <ReportModal
            open={reportModal.value}
            artifactsId={modalArtifactsId}
            onClose={handleCloseReportModal}
          />
        </Stack>

        <PrepareDataProgress />
      </Page>
    </>
  );
};

export default TesterPage;
