import type { Concert, CostFieldKey } from "./types";
import { COST_FIELDS } from "./types";

export function toNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function totalCost(concert: Pick<Concert, CostFieldKey>): number {
  return COST_FIELDS.reduce((sum, field) => sum + toNumber(concert[field.key]), 0);
}

export function costPerHour(
  concert: Pick<Concert, CostFieldKey | "hours_at_event">
): number | null {
  const hours = toNumber(concert.hours_at_event);
  if (hours <= 0) return null;
  return totalCost(concert) / hours;
}

/** Fun Points per $100 = (fun rating / total cost) * 100 */
export function funPointsPer100(
  concert: Pick<Concert, CostFieldKey | "fun_rating">
): number | null {
  const cost = totalCost(concert);
  if (cost <= 0) return null;
  return (toNumber(concert.fun_rating) / cost) * 100;
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(value: number, digits = 1): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(value);
}

export function categoryTotals(concerts: Concert[]) {
  return COST_FIELDS.map((field) => ({
    name: field.label,
    key: field.key,
    total: concerts.reduce((sum, c) => sum + toNumber(c[field.key]), 0),
  }));
}
