import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import { Job } from "@packages/types";
import React, { FC, useEffect, useRef, useState } from "react";
import { EditorModal, JobControlButtons, saveJob, removeJob } from "@/features/job";
import { useConfig } from "@/entities/config";
import { JobsTable, useJobs } from "@/entities/job";
import { LogProcess, logsActions, LogsPanel, LogsPanelRef } from "@/entities/log";
import { useAppDispatch } from "@/shared/lib/hooks/useAppDispatch";
import { useBoolean } from "@/shared/lib/hooks/useBoolean";
import { Iconify } from "@/shared/ui/iconify";
import { Page } from "@/shared/ui/page";

interface StrategyPageProps {
  title: string;
}

const StrategyPage: FC<StrategyPageProps> = (props) => {
  const { title } = props;

  const dispatch = useAppDispatch();
  const jobs = useJobs();
  const { exchangeList } = useConfig();

  const [processes, setProcesses] = useState<LogProcess[]>([]);

  const logsPanelRef = useRef<LogsPanelRef | null>(null);
  const lastLogsArtifactId = useRef("");

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [editMode, setEditMode] = useState<"copy" | "update" | null>(null);

  const editorModal = useBoolean();
  const deleteDialog = useBoolean();

  useEffect(() => {
    if (!jobs.length || !!selectedJob) return;

    const url = new URL(document.location.href);
    const jobId = url.searchParams.get("popup");
    if (!jobId) return;

    const job = jobs.find((job) => job.id.toString() === jobId);
    setSelectedJob(job ?? null);
    if (job) editorModal.onTrue();

    url.searchParams.delete("popup");
    history.replaceState({}, "", url);
  }, [jobs, selectedJob]);

  useEffect(() => {
    const processes = jobs.map((job) => ({
      id: job.id,
      name: job.name,
      strategy: job.strategy.name,
      artifacts: job.artifacts,
    }));
    setProcesses(processes);
  }, [jobs]);

  const handleLogsClicked = (artifactsId: string) => {
    dispatch(logsActions.setProcessFilter(artifactsId));

    if (lastLogsArtifactId.current === artifactsId) {
      logsPanelRef.current?.toggle();
    } else {
      logsPanelRef.current?.setActive(true);
    }

    lastLogsArtifactId.current = artifactsId;
  };

  const handleCreateClicked = () => {
    setSelectedJob(null);
    setEditMode(null);
    editorModal.onTrue();
  };

  const handleEditClicked = (job: Job) => {
    setSelectedJob(job);
    setEditMode("update");
    editorModal.onTrue();
  };

  const handleCopyClicked = (job: Job) => {
    setSelectedJob(job);
    setEditMode("copy");
    editorModal.onTrue();
  };

  const handleDeleteClicked = (job: Job) => {
    setSelectedJob(job);
    deleteDialog.onTrue();
  };

  const handleRemoveJob = () => {
    if (!selectedJob) return;
    removeJob(selectedJob.id);
    setSelectedJob(null);
    deleteDialog.onFalse();
  };

  const handleCloseEditorModal = () => {
    setSelectedJob(null);
    setEditMode(null);
    editorModal.onFalse();
  };

  return (
    <Page title={title}>
      <Stack sx={{ px: 1 }} gap={3}>
        <Stack direction={"row"} alignItems={"center"} justifyContent={"flex-end"} gap={1}>
          <Button
            variant={"outlined"}
            color={"warning"}
            startIcon={<Iconify width={15} icon={"eva:plus-fill"} />}
            size={"small"}
            onClick={handleCreateClicked}
          >
            Create runtime
          </Button>
        </Stack>
        <Box sx={{ flexGrow: 1 }}>
          <JobsTable
            exchanges={exchangeList}
            renderControlButtons={(job: Job) => (
              <JobControlButtons
                job={job}
                onCopy={handleCopyClicked}
                onEdit={handleEditClicked}
                onOpenLogs={handleLogsClicked}
                onDelete={handleDeleteClicked}
              />
            )}
          />
        </Box>
        <LogsPanel
          initialArtifactsId={processes[0]?.artifacts}
          processes={processes}
          onRef={(ref) => {
            logsPanelRef.current = ref;
          }}
        />

        <Dialog open={deleteDialog.value}>
          <DialogTitle>Delete {selectedJob?.name}</DialogTitle>
          <DialogContent>Are you sure you want to delete the script?</DialogContent>
          <DialogActions>
            <Button onClick={deleteDialog.onFalse}>Cancel</Button>
            <Button variant={"contained"} color={"error"} onClick={handleRemoveJob}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <EditorModal
          open={editorModal.value}
          job={selectedJob}
          onSave={saveJob}
          onClose={handleCloseEditorModal}
          editMode={editMode}
        />
      </Stack>
    </Page>
  );
};

export default StrategyPage;
