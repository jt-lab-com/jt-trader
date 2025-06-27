import Stack from "@mui/material/Stack";
import { FC } from "react";
import { CardData } from "../../../model/types";
import { Card } from "./Card";

interface CardListProps {
  list: CardData[];
}

export const CardList: FC<CardListProps> = (props) => {
  const { list } = props;

  return (
    <Stack direction={"row"} flexWrap={"wrap"} gap={3}>
      {list.map((card, i) => (
        <Card key={`${card.title}-${i}`} data={card} />
      ))}
    </Stack>
  );
};
