import MUICard from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { CandleStick } from "@packages/types";
import dayjs from "dayjs";
import { Expression, Parser } from "expr-eval";
import { FC, useEffect, useRef, useState } from "react";
import { useThrottle } from "@/shared/lib/hooks/useThrottle";
import { fCurrency } from "@/shared/lib/utils/format-number";
import { chartEvents, Events } from "../../../../lib/chart-playback/events";
import { CardType } from "../../../../model/types/chart-playback";

const parser = new Parser();

interface CardProps {
  type: CardType;
  title: string;
  cardId?: string;
  initialValue?: string | number;
}

export const Card: FC<CardProps> = (props) => {
  const { cardId, type, title } = props;
  let { initialValue } = props;

  let initialExpression: Expression | null = null;
  if (type === CardType.Formula && typeof initialValue === "string") {
    initialExpression = parser.parse(initialValue);
  }
  if (type === CardType.Date && initialValue) {
    initialValue = dayjs(initialValue).format("MM.DD.YYYY HH:mm");
  }
  if (type === CardType.Currency && initialValue) {
    initialValue = fCurrency(initialValue);
  }

  const exprRef = useRef<Expression | null>(initialExpression);
  const [value, setValue] = useState(initialValue);
  const throttledValue = useThrottle(value, 300);

  useEffect(() => {
    const subscribers = [
      chartEvents.on(Events.Tick, (candle: CandleStick) => {
        if (type !== CardType.Formula) return;
        setValue(fCurrency(exprRef.current?.evaluate({ price: candle.close })));
      }),

      chartEvents.on(Events.CardValueChange, (eventCardId: string, value: string) => {
        if (cardId !== eventCardId) return;

        switch (type) {
          case CardType.Formula:
            exprRef.current = parser.parse(value);
            break;
          case CardType.Currency:
            setValue(fCurrency(value));
            break;
          case CardType.Date:
            setValue(dayjs(value).format("MM.DD.YYYY HH:mm"));
            break;
          case CardType.Text:
            setValue(value);
        }
      }),
    ];

    return () => {
      subscribers.forEach((unsub) => unsub());
    };
  }, []);

  return (
    <MUICard sx={{ height: 100, width: 250 }}>
      <CardContent>
        <Typography variant={"subtitle2"}>{title}</Typography>
        <Typography variant={"h5"}>{throttledValue}</Typography>
      </CardContent>
    </MUICard>
  );
};
