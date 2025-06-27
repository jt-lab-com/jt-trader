import { Typography } from "@mui/material";
import { FC } from "react";
import { TextBlockData } from "../../../model/types";

interface TextBlockProps {
  data: TextBlockData;
}

export const TextBlock: FC<TextBlockProps> = (props) => {
  const { data } = props;

  return (
    <Typography variant={data.variant} align={data.align ?? "center"}>
      {data.value}
    </Typography>
  );
};
