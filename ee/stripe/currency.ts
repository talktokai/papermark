/**
 * Billing currency definitions.
 *
 * Stub replacement: the upstream repository imports this module but does not
 * publish it. The shape is reconstructed from its consumers
 * (components/billing/plan-price.tsx, lib/swr/use-geo-currency.ts,
 * lib/swr/use-subscription-currency.ts), which only ever use the two
 * currencies below plus their symbol and label maps.
 */
export type Currency = "usd" | "eur";

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  usd: "$",
  eur: "€",
};

export const CURRENCY_LABEL: Record<Currency, string> = {
  usd: "USD",
  eur: "EUR",
};
