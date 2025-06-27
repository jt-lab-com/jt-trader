import dayjs from "dayjs";
import Yup from "@/shared/lib/utils/yup";

export const timeframes = [
  { title: "1m", value: "1" },
  { title: "5m", value: "5" },
  { title: "15m", value: "15" },
  { title: "1h", value: "60" },
  { title: "4h", value: "240" },
];

const today = dayjs().format("YYYY-MM");

export const staticScopeSchema = Yup.array()
  .notRequired()
  .of(
    Yup.object().shape({
      key: Yup.string().required("Required field"),
      value: Yup.string().required("Required field"),
      options: Yup.array().of(
        Yup.object().shape({ label: Yup.string().required(), value: Yup.string().required() }).optional()
      ),
    })
  );

export const scenarioSchema = Yup.object().shape({
  scenarioName: Yup.string().required("Name required"),
  selectedStrategy: Yup.object()
    .shape({
      id: Yup.mixed(),
      type: Yup.string(),
      name: Yup.string(),
      path: Yup.string().nullable(),
    })
    .required("Select script"),
  hedgeMode: Yup.boolean().notRequired(),
  symbols: Yup.string().required("Symbols required"),
  startTime: Yup.string()
    .required("Required field")
    .matches(/^\d{4}-(0[1-9]|1[0-2])$/, "Incorrect start time format. Example: 2023-07")
    .test(
      "is-day-before",
      "The date must be before the current month and cannot be in the future",
      (value) => {
        return dayjs(value).isBefore(today, "month");
      }
    ),
  endTime: Yup.string()
    .required("Required field")
    .matches(/^\d{4}-(0[1-9]|1[0-2])$/, "Incorrect end time format. Example: 2023-07")
    .test(
      "is-day-before",
      "The date must be before the current month and cannot be in the future",
      (value) => {
        return dayjs(value).isBefore(today, "month");
      }
    )
    .test("is-greater", "The end date must be greater than the start date.", function (value) {
      const { startTime } = this.parent;
      const startDate = dayjs(startTime, "YYYY-MM");
      const endDate = dayjs(value, "YYYY-MM");

      return startDate && endDate ? endDate.isSame(startDate) || startDate.isBefore(endDate) : true;
    }),
  spread: Yup.number().typeError("Spread must be between 0 and 1").required("Required field").min(0).max(1),
  makerFee: Yup.number().typeError("Maker fee required").required("Required field"),
  takerFee: Yup.number().typeError("Taker fee required").required("Required field"),
  leverage: Yup.number().typeError("Leverage required").required("Required field"),
  balance: Yup.number().typeError("Balance required").required("Required field"),
  exchange: Yup.string().typeError("Exchange required").required("Required field"),
  timeframe: Yup.string()
    .required()
    .oneOf(timeframes.map(({ value }) => value)),
  staticScope: Yup.array()
    .notRequired()
    .of(
      Yup.object().shape({
        key: Yup.string().required("Required field"),
        value: Yup.string().required("Required field"),
      })
    ),
  dynamicScope: Yup.array()
    .required()
    .of(
      Yup.object().shape({
        name: Yup.string().required("Required field"),
        begin: Yup.number().required("Required field"),
        end: Yup.number().required("Required field"),
        step: Yup.number().required("Required field"),
      })
    ),
});

export type ScenarioSchema = Yup.InferType<typeof scenarioSchema>;
