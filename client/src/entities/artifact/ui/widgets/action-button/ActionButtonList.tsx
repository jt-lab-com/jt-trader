import Stack from "@mui/material/Stack";
import { FC } from "react";
import { ActionButtonData } from "../../../model/types";
import { ActionButton } from "./ActionButton";

interface ActionButtonListProps {
  artifactId: string;
  data: ActionButtonData[];
}

export const ActionButtonList: FC<ActionButtonListProps> = (props) => {
  const { artifactId, data } = props;

  return (
    <Stack gap={2} direction={"row"} flexWrap={"wrap"}>
      {data.map((button, i) => (
        <ActionButton key={`${button.action}-${i}`} artifactId={artifactId} data={button} />
      ))}
    </Stack>
  );
};
