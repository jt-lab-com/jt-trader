import { ExchangeField } from "@packages/types";

interface ValidateResult {
  valid: boolean;
  errors: Record<string, string>;
}

export const validate = (fields: ExchangeField[]): ValidateResult => {
  let valid = false;
  let errors = {};

  fields.forEach((field) => {
    if (field.type !== "string") return;

    if (typeof field.value === "string" && field.value.length < 5) {
      errors = {
        ...errors,
        [field.name]: "not a valid",
      };
    }
  });

  if (!Object.keys(errors).length) {
    valid = true;
  }

  return {
    valid,
    errors,
  };
};
