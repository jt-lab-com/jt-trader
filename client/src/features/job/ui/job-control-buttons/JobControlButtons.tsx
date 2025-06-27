import LoadingButton from "@mui/lab/LoadingButton";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import { Job } from "@packages/types";
import { FC } from "react";
import { useBoolean } from "@/shared/lib/hooks/useBoolean";
import { Iconify } from "@/shared/ui/iconify";
import { RouterLink } from "@/shared/ui/router-link";
import { runJob } from "../../model/services/run";
import { stopJob } from "../../model/services/stop";

interface JobControlButtonsProps {
  job: Job;
  onEdit: (job: Job) => void;
  onCopy: (job: Job) => void;
  onDelete: (job: Job) => void;
  onOpenLogs: (artifactsId: string) => void;
}

export const JobControlButtons: FC<JobControlButtonsProps> = (props) => {
  const { job, onOpenLogs, onEdit, onCopy, onDelete } = props;

  const loading = useBoolean();

  const handleOpenLogs = () => {
    onOpenLogs(job.artifacts);
  };

  const handleEdit = () => {
    onEdit(job);
  };

  const handleCopy = () => {
    onCopy(job);
  };

  const handleDelete = () => {
    onDelete(job);
  };

  const handleRun = () => {
    loading.onTrue();
    runJob(job.id);

    setTimeout(loading.onFalse, 3000);
  };

  const handleStop = () => {
    stopJob(job.id);
  };

  return (
    <>
      <Stack direction={"row"} gap={1}>
        <LoadingButton
          startIcon={
            <Iconify width={15} icon={job.isEnabled ? "solar:stop-circle-outline" : "solar:play-bold"} />
          }
          variant={"outlined"}
          size={"small"}
          color={job.isEnabled ? "warning" : "primary"}
          loading={loading.value}
          onClick={job.isEnabled ? handleStop : handleRun}
        >
          {job.isEnabled ? "Stop" : "Run"}
        </LoadingButton>
        <Button
          component={RouterLink}
          href={`/report/${job.artifacts}`}
          target={"_blank"}
          startIcon={<Iconify width={15} icon={"solar:clipboard-outline"} />}
          variant={"outlined"}
          size={"small"}
        >
          Report
        </Button>
        <Button
          startIcon={<Iconify width={15} icon={"solar:document-linear"} />}
          variant={"outlined"}
          size={"small"}
          onClick={handleOpenLogs}
        >
          Logs
        </Button>
        <IconButton size={"small"} onClick={handleEdit}>
          <Iconify icon={"solar:settings-linear"} />
        </IconButton>
        <IconButton size={"small"} onClick={handleCopy}>
          <Iconify icon={"solar:copy-linear"} />
        </IconButton>
        <IconButton size={"small"} onClick={handleDelete}>
          <Iconify icon={"solar:trash-bin-2-linear"} />
        </IconButton>
      </Stack>
    </>
  );
};
