import { Tooltip } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import { FC } from "react";
import { useFormContext } from "react-hook-form";
import { Iconify } from "@/shared/ui/iconify";

interface CopyArgsButtonProps {}

export const CopyArgsButton: FC<CopyArgsButtonProps> = () => {
  const { getValues } = useFormContext();

  const handleCopy = async () => {
    const args = getValues("args");
    await navigator.clipboard.writeText(JSON.stringify(args));
  };

  return (
    <Tooltip title={"Copy args"}>
      <IconButton size={"small"} onClick={handleCopy}>
        <Iconify width={15} icon={"solar:copy-linear"} />
      </IconButton>
    </Tooltip>
  );
};
