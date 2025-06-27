import { Tooltip } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import { FC } from "react";
import { useFormContext } from "react-hook-form";
import { Iconify } from "@/shared/ui/iconify";
import { argsSchema } from "../../model/schema/job.schema";

interface PasteArgsButtonProps {}

export const PasteArgsButton: FC<PasteArgsButtonProps> = () => {
  const { setValue } = useFormContext();

  const handlePaste = async () => {
    const rawArgs = await navigator.clipboard.readText();

    try {
      const args = await argsSchema.validate(JSON.parse(rawArgs));
      setValue("args", args);
    } catch (e) {
      console.error("Error inserting arguments: invalid schema");
    }
  };

  return (
    <Tooltip title={"Paste args"}>
      <IconButton size={"small"} onClick={handlePaste}>
        <Iconify width={15} icon={"solar:copy-bold"} />
      </IconButton>
    </Tooltip>
  );
};
