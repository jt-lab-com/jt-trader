import Button from "@mui/material/Button";
import React, { FC } from "react";
import { useBoolean } from "@/shared/lib/hooks/useBoolean";
import { Iconify } from "@/shared/ui/iconify";
import { createScenario } from "../../api/create";
import { EditorModal } from "../editor-modal/EditorModal";

interface CreateScenarioButtonProps {}

export const CreateScenarioButton: FC<CreateScenarioButtonProps> = () => {
  const modal = useBoolean();

  const handleNewScenarioClicked = () => {
    modal.onTrue();
  };

  return (
    <>
      <Button
        variant={"outlined"}
        color={"warning"}
        onClick={handleNewScenarioClicked}
        size={"small"}
        startIcon={<Iconify width={15} icon={"eva:plus-fill"} />}
      >
        New Scenario
      </Button>

      <EditorModal open={modal.value} onClose={modal.onFalse} onSave={createScenario} />
    </>
  );
};
