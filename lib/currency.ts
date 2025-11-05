export const supportedCurrencies = [
  { value: "USD", label: "US Dollar (USD)" },
  { value: "KES", label: "Kenyan Shilling (KES)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "ZAR", label: "South African Rand (ZAR)" },
  { value: "JPY", label: "Japanese Yen (JPY)" },
] as const;

export type SupportedCurrency = (typeof supportedCurrencies)[number]["value"];

export const formatCurrencyValue = (value: number, currency: SupportedCurrency) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);

