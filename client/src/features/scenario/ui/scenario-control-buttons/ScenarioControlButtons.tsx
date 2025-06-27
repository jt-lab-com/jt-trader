import LoadingButton from "@mui/lab/LoadingButton";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import { CreateScenarioParams, Scenario } from "@packages/types";
import { FC, useEffect, useState } from "react";
import { useBoolean } from "@/shared/lib/hooks/useBoolean";
import { Iconify } from "@/shared/ui/iconify";
import { RouterLink } from "@/shared/ui/router-link";
import { createScenario } from "../../api/create";
import { removeScenario } from "../../api/remove";
import { runScenario } from "../../api/run";
import { EditorModal } from "../editor-modal/EditorModal";

interface ScenarioControlButtonsProps {
  scenario: Scenario;
}

type EditMode = "update" | "copy";

export const ScenarioControlButtons: FC<ScenarioControlButtonsProps> = (props) => {
  const { scenario } = props;

  const [editMode, setEditMode] = useState<EditMode | null>(null);
  const modal = useBoolean();
  const deleteDialog = useBoolean();
  const loading = useBoolean();

  useEffect(() => {
    if (scenario.sets.some((set) => set.status === 2)) {
      loading.onTrue();
    }

    if (scenario.sets.every((set) => set.status !== 2)) {
      loading.onFalse();
    }
  }, [scenario.sets]);

  const handleRun = (sync: boolean) => async () => {
    loading.onTrue();
    runScenario(scenario.id, sync);
  };

  const handleDelete = () => {
    removeScenario(scenario.id);
  };

  const handleUpdate = (updatedScenario: CreateScenarioParams) => {
    setEditMode(null);
    removeScenario(scenario.id);
    createScenario(updatedScenario);
  };

  const handleCreateCopy = (scenario: CreateScenarioParams) => {
    setEditMode(null);
    createScenario(scenario);
  };

  const handleEdit = () => {
    setEditMode("update");
    modal.onTrue();
  };

  const handleCopy = () => {
    setEditMode("copy");
    modal.onTrue();
  };

  const saveHandler = editMode === "copy" ? handleCreateCopy : handleUpdate;

  return (
    <>
      <Stack direction={"row"} justifyContent={"flex-end"} gap={1.5}>
        <LoadingButton
          variant={"outlined"}
          loading={loading.value}
          color={"primary"}
          size={"small"}
          startIcon={<Iconify width={15} icon={"solar:play-bold"} />}
          onClick={handleRun(true)}
        >
          Run
        </LoadingButton>
        {/*<LoadingButton*/}
        {/*  variant={"outlined"}*/}
        {/*  loading={loading.value}*/}
        {/*  color={"primary"}*/}
        {/*  size={"small"}*/}
        {/*  startIcon={<Iconify width={15} icon={"solar:play-bold"} />}*/}
        {/*  onClick={handleRun(false)}*/}
        {/*>*/}
        {/*  Run Async*/}
        {/*</LoadingButton>*/}
        <Button
          component={RouterLink}
          href={`/report/${scenario.artifacts}`}
          target={"_blank"}
          variant={"contained"}
          color={"info"}
          size={"small"}
          startIcon={<Iconify width={15} icon={"solar:clipboard-outline"} />}
          disabled={loading.value}
        >
          Full Report
        </Button>
        <IconButton size={"small"} onClick={handleEdit} disabled={loading.value}>
          <Iconify icon={"solar:settings-linear"} />
        </IconButton>
        <IconButton size={"small"} onClick={handleCopy}>
          <Iconify icon={"solar:copy-linear"} />
        </IconButton>
        <IconButton size={"small"} onClick={deleteDialog.onTrue}>
          <Iconify icon={"solar:trash-bin-2-linear"} />
        </IconButton>
      </Stack>

      <Dialog open={deleteDialog.value} onClose={deleteDialog.onFalse}>
        <DialogTitle>Delete scenario</DialogTitle>
        <DialogContent>Are you sure you want to delete the scenario?</DialogContent>
        <DialogActions>
          <Button onClick={deleteDialog.onFalse}>Cancel</Button>
          <Button variant={"contained"} color={"error"} onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <EditorModal
        open={modal.value}
        onSave={saveHandler}
        scenario={scenario}
        editMode={editMode}
        onClose={modal.onFalse}
      />
    </>
  );
};
