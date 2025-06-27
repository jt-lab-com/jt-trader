import Button from "@mui/material/Button";
import React, { FC } from "react";
import { Iconify } from "@/shared/ui/iconify";
import { stopAllScenarios } from "../../api/stop-all";

interface StopAllScenariosButtonProps {}

export const StopAllScenariosButton: FC<StopAllScenariosButtonProps> = () => {
  const handleClick = () => {
    stopAllScenarios();
  };

  return (
    <Button
      onClick={handleClick}
      variant={"outlined"}
      size={"small"}
      startIcon={<Iconify width={15} icon={"solar:stop-circle-outline"} />}
    >
      Stop all
    </Button>
  );
};
