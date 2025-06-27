import { Job } from "@packages/types";
import { nanoid } from "nanoid";
import * as Yup from "yup";

export const argsSchema = Yup.array()
  .notRequired()
  .of(
    Yup.object().shape({
      key: Yup.string().trim(),
      value: Yup.string().trim(),
      options: Yup.array()
        .of(
          Yup.object().shape({
            value: Yup.string(),
            label: Yup.string(),
          })
        )
        .optional(),
    })
  );

export const jobSchema = Yup.object().shape({
  id: Yup.number().notRequired(),
  selectedStrategy: Yup.object()
    .shape({
      id: Yup.mixed(),
      type: Yup.string(),
      name: Yup.string(),
      path: Yup.string().nullable(),
    })
    .required("Select script"),
  jobName: Yup.string().required("Job name is required").min(2, "Min length 2 characters").trim(),
  prefix: Yup.string().required("Prefix name is required").min(8, "Min length 8 characters").trim(),
  runtimeType: Yup.string().required("Runtime type required").oneOf(["market", "system"]),
  exchange: Yup.string().required("Select exchange"),
  symbols: Yup.array().of(Yup.string()).notRequired(),
  args: argsSchema,
});

export const defaultArgParam = { key: "", value: "" };

export const getJobDefaultValues = (job?: Job | null, isCopy?: boolean): JobSchema => {
  return {
    id: isCopy ? undefined : job?.id,
    prefix: isCopy ? nanoid(8) : job?.prefix ?? nanoid(8),
    selectedStrategy: job?.strategy ?? null,
    jobName: isCopy ? `${job?.name} (copy)` : job?.name ?? "",
    exchange: job?.exchange ?? "",
    runtimeType: job?.runtimeType ?? "market",
    symbols: [],
    args: [{ ...defaultArgParam }],
  };
};

export type JobSchema = Yup.InferType<typeof jobSchema>;
