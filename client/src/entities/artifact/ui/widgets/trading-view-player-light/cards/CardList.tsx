import Stack from "@mui/material/Stack";
import { FC, useMemo } from "react";
import { PlaybackChartCard } from "../../../../model/types";
import { Card } from "./Card";

interface CardListProps {
  data?: PlaybackChartCard[];
}

export const CardList: FC<CardListProps> = (props) => {
  const { data } = props;

  const cards = useMemo(() => {
    if (!data) return [];
    const seen = new Set();
    return data.filter((card) => {
      if (!card.id) return true;
      if (seen.has(card.id)) return false;
      seen.add(card.id);
      return true;
    });
  }, [data]);

  return (
    <Stack direction={"row"} gap={3} flexWrap={"wrap"}>
      {cards.map((card, i) => (
        <Card
          key={`${card.id}_${i}`}
          cardId={card.id}
          type={card.type}
          title={card.title}
          initialValue={card.value}
        />
      ))}
    </Stack>
  );
};
