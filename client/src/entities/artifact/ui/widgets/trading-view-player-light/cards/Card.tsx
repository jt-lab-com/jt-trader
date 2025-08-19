import MUICard from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { CandleStick } from "@packages/types";
import dayjs from "dayjs";
import { Expression, Parser } from "expr-eval";
import { FC, ReactNode, useEffect, useRef, useState } from "react";
import { useThrottle } from "@/shared/lib/hooks/useThrottle";
import { fCurrency } from "@/shared/lib/utils/format-number";
import { chartEvents, Events } from "../../../../lib/chart-playback/events";
import {
  CardType,
  CurrencyOptions,
  DateOptions,
  FormulaOptions,
  TextOptions,
} from "../../../../model/types/chart-playback";

const parser = new Parser();

type CardConfigMap = {
  [CardType.Formula]: {
    initialValue?: string;
    options?: FormulaOptions;
  };
  [CardType.Date]: {
    initialValue?: string | number;
    options?: DateOptions;
  };
  [CardType.Currency]: {
    initialValue?: number;
    options?: CurrencyOptions;
  };
  [CardType.Text]: {
    initialValue?: string;
    options?: TextOptions;
  };
};

export type CardProps<T extends CardType = CardType> = {
  type: T;
  title: string;
  cardId?: string;
  initialValue: string | number;
} & CardConfigMap[T];

export const Card = <T extends CardType>(props: CardProps<T>) => {
  if (isFormulaCard(props)) {
    return <FormulaCard {...props} />;
  }
  if (isCurrencyCard(props)) {
    return <CurrencyCard {...props} />;
  }
  if (isDateCard(props)) {
    return <DateCard {...props} />;
  }
  if (isTextCard(props)) {
    return <TextCard {...props} />;
  }
};

interface BaseCardProps {
  title: string;
  cardId?: string;
  children: ReactNode;
}

const BaseCard: FC<BaseCardProps> = (props) => {
  const { title, children } = props;

  return (
    <MUICard>
      <CardContent>
        <Typography variant={"subtitle2"}>{title}</Typography>
        <Typography variant={"h5"}>{children}</Typography>
      </CardContent>
    </MUICard>
  );
};

interface FormulaCardProps extends Omit<BaseCardProps, "children"> {
  options?: FormulaOptions;
  initialValue?: string;
}

const FormulaCard: FC<FormulaCardProps> = (props) => {
  const { initialValue, cardId, options } = props;

  const exprRef = useRef<Expression | null>(null);
  const [value, setValue] = useState(initialValue);
  const throttledValue = useThrottle(value, 300);

  useEffect(() => {
    const subscribers = [
      chartEvents.on(Events.Tick, (candle: CandleStick) => {
        setValue(exprRef.current?.evaluate({ price: candle.close }));
      }),

      chartEvents.on(Events.CardValueChange, (eventCardId: string, value: string) => {
        if (cardId !== eventCardId) return;
        exprRef.current = parser.parse(value);
      }),
    ];

    return () => {
      subscribers.forEach((unsub) => unsub());
    };
  }, []);

  return (
    <BaseCard {...props}>
      {!isNaN(Number(throttledValue)) && options?.prefix}
      {isNaN(Number(throttledValue)) ? (
        <Typography variant={"h5"} sx={{ opacity: 0.3, fontWeight: 500 }}>
          {throttledValue}
        </Typography>
      ) : (
        Number(`${throttledValue}`).toFixed(options?.precision ?? 2)
      )}
      {!isNaN(Number(throttledValue)) && options?.suffix}
    </BaseCard>
  );
};

interface CurrencyCardProps extends Omit<BaseCardProps, "children"> {
  options?: CurrencyOptions;
  initialValue?: number;
}

const CurrencyCard: FC<CurrencyCardProps> = (props) => {
  const { options, cardId, initialValue } = props;

  const [value, setValue] = useState(initialValue ? fCurrency(initialValue, options?.currency) : "");

  useEffect(() => {
    const unsub = chartEvents.on(Events.CardValueChange, (eventCardId: string, value: string) => {
      if (cardId !== eventCardId) return;
      setValue(fCurrency(value, options?.currency));
    });

    return () => {
      unsub();
    };
  }, []);

  return <BaseCard {...props}>{value}</BaseCard>;
};

interface DateCardProps extends Omit<BaseCardProps, "children"> {
  options?: DateOptions;
  initialValue?: string | number;
}

const defaultDateFormat = "MM.DD.YYYY HH:mm";
const DateCard: FC<DateCardProps> = (props) => {
  const { cardId, initialValue, options } = props;
  const [value, setValue] = useState(dayjs(initialValue).format(options?.format ?? defaultDateFormat));

  useEffect(() => {
    const unsub = chartEvents.on(Events.CardValueChange, (eventCardId: string, value: string) => {
      if (cardId !== eventCardId) return;
      setValue(dayjs(value).format(options?.format ?? defaultDateFormat));
    });

    return () => {
      unsub();
    };
  }, []);

  return <BaseCard {...props}>{value}</BaseCard>;
};

interface TextCardProps extends Omit<BaseCardProps, "children"> {
  options?: TextOptions;
  initialValue?: string;
}

const TextCard: FC<TextCardProps> = (props) => {
  const { cardId, initialValue } = props;

  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const unsub = chartEvents.on(Events.CardValueChange, (eventCardId: string, value: string) => {
      if (cardId !== eventCardId) return;
      setValue(value);
    });

    return () => {
      unsub();
    };
  }, []);

  return <BaseCard {...props}>{value}</BaseCard>;
};

function isFormulaCard(p: CardProps): p is CardProps<CardType.Formula> {
  return p.type === CardType.Formula;
}

function isDateCard(p: CardProps): p is CardProps<CardType.Date> {
  return p.type === CardType.Date;
}

function isCurrencyCard(p: CardProps): p is CardProps<CardType.Currency> {
  return p.type === CardType.Currency;
}

function isTextCard(p: CardProps): p is CardProps<CardType.Text> {
  return p.type === CardType.Text;
}
