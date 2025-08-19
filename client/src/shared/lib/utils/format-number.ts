type InputValue = number | string;

export const fCurrency = (value: InputValue, currency: string = "USD", precision = 2) => {
  if (!value) return "";

  const number = Number(value);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: precision,
  }).format(number);
};

export function fShortenCurrency(value: InputValue, currency: string = "USD") {
  if (!value) return "";

  const number = Number(value);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    compactDisplay: "short",
    notation: "compact",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(number);
}

export function fNumber(inputValue: InputValue) {
  if (!inputValue) return "";

  const number = Number(inputValue);

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(number);
}

export function fShortenNumber(inputValue: InputValue) {
  if (!inputValue) return "";

  const number = Number(inputValue);

  const fm = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(number);

  return fm.replace(/[A-Z]/g, (match) => match.toLowerCase());
}
