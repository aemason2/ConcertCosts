export type TicketProvider = "ticketmaster" | "axs" | "seatgeek" | "unknown";

export type ExtractedTicketCosts = {
  ticket_cost: number;
  ticket_fees: number;
  tax_cost: number;
  delivery_cost: number;
  provider: TicketProvider;
  confidence: "high" | "medium" | "low";
  matchedLabels: string[];
  warnings: string[];
};

function parseMoney(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

function detectProvider(input: string): TicketProvider {
  const s = input.toLowerCase();
  if (s.includes("ticketmaster") || s.includes("livenation")) return "ticketmaster";
  if (s.includes("axs.com") || s.includes("axs")) return "axs";
  if (s.includes("seatgeek")) return "seatgeek";
  return "unknown";
}

/** Strip tags / scripts so price labels are easier to match. */
export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#36;/g, "$")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n+/g, "\n")
    .trim();
}

type MoneyHit = { amount: number; index: number; context: string };

function findMoneyHits(text: string): MoneyHit[] {
  const hits: MoneyHit[] = [];
  const re = /\$\s*([\d,]+(?:\.\d{1,2})?)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const amount = parseMoney(match[1]);
    if (amount == null) continue;
    const start = Math.max(0, match.index - 60);
    const end = Math.min(text.length, match.index + match[0].length + 40);
    hits.push({
      amount,
      index: match.index,
      context: text.slice(start, end).replace(/\s+/g, " "),
    });
  }
  return hits;
}

const FEE_RE =
  /\b(service\s*fee|facility\s*fee|convenience\s*fee|order\s*processing|handling\s*fee|ticket\s*fee|fees?|service\s*charge)\b/i;
const TAX_RE = /\b(sales\s*tax|tax(?:es)?|vat)\b/i;
const DELIVERY_RE =
  /\b(delivery|shipping|mobile\s*delivery|will\s*call|ups|fedex|postage|print[- ]at[- ]home)\b/i;
const BASE_RE =
  /\b(ticket(?:s)?(?:\s*price)?|face\s*value|base\s*price|price\s*each|unit\s*price|subtotal|admission)\b/i;
const TOTAL_RE = /\b(order\s*total|grand\s*total|total\s*due|amount\s*paid|you\s*paid)\b/i;

function classifyHit(hit: MoneyHit): "base" | "fees" | "tax" | "delivery" | "total" | null {
  const c = hit.context;
  if (TOTAL_RE.test(c) && !BASE_RE.test(c)) return "total";
  if (DELIVERY_RE.test(c)) return "delivery";
  if (TAX_RE.test(c)) return "tax";
  if (FEE_RE.test(c)) return "fees";
  if (BASE_RE.test(c)) return "base";
  return null;
}

/**
 * Pull ticket price pieces from receipt/checkout text (or page text).
 * Best-effort: ticket sites often hide full breakdowns behind login.
 */
export function extractTicketCostsFromText(
  rawText: string,
  hintUrl = ""
): ExtractedTicketCosts {
  const provider = detectProvider(`${hintUrl}\n${rawText}`);
  const text = rawText;
  const hits = findMoneyHits(text);
  const matchedLabels: string[] = [];
  const warnings: string[] = [];

  let ticket_cost = 0;
  let ticket_fees = 0;
  let tax_cost = 0;
  let delivery_cost = 0;
  let orderTotal: number | null = null;

  const feeAmounts: number[] = [];

  for (const hit of hits) {
    const kind = classifyHit(hit);
    if (!kind) continue;
    matchedLabels.push(`${kind}: $${hit.amount.toFixed(2)}`);
    if (kind === "base" && ticket_cost === 0) ticket_cost = hit.amount;
    if (kind === "fees") feeAmounts.push(hit.amount);
    if (kind === "tax" && tax_cost === 0) tax_cost = hit.amount;
    if (kind === "delivery" && delivery_cost === 0) delivery_cost = hit.amount;
    if (kind === "total") orderTotal = hit.amount;
  }

  // Sum distinct-looking fee lines (avoid double-counting same amount twice in a row)
  if (feeAmounts.length > 0) {
    ticket_fees = feeAmounts.reduce((a, b) => a + b, 0);
    // If we somehow summed a duplicated total, keep the max single fee as safer default
    if (orderTotal != null && ticket_cost > 0) {
      const impliedFees = Math.max(
        0,
        orderTotal - ticket_cost - tax_cost - delivery_cost
      );
      // Prefer implied fees when labeled fees look inflated
      if (impliedFees > 0 && ticket_fees > impliedFees * 1.5) {
        ticket_fees = Math.round(impliedFees * 100) / 100;
        matchedLabels.push(`fees(adjusted from total): $${ticket_fees.toFixed(2)}`);
      }
    }
  }

  // SeatGeek / Ticketmaster often show "Price + Fees" as one number — split if we only got total+base
  if (ticket_cost === 0 && orderTotal != null && tax_cost === 0 && delivery_cost === 0) {
    ticket_cost = orderTotal;
    warnings.push(
      "Only found a total. Put the base ticket price in Ticket cost and move fees/taxes if needed."
    );
  }

  if (ticket_cost === 0 && ticket_fees === 0 && tax_cost === 0 && delivery_cost === 0) {
    warnings.push(
      "Could not find a clear price breakdown. Paste the order summary text (Ticket / Fees / Tax / Delivery lines)."
    );
  }

  let confidence: ExtractedTicketCosts["confidence"] = "low";
  const filled = [ticket_cost, ticket_fees, tax_cost, delivery_cost].filter((n) => n > 0)
    .length;
  if (filled >= 3) confidence = "high";
  else if (filled >= 2 || (ticket_cost > 0 && ticket_fees > 0)) confidence = "medium";

  return {
    ticket_cost,
    ticket_fees: Math.round(ticket_fees * 100) / 100,
    tax_cost,
    delivery_cost,
    provider,
    confidence,
    matchedLabels,
    warnings,
  };
}

export function isSupportedTicketUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host.includes("ticketmaster.") ||
      host.includes("livenation.") ||
      host.includes("axs.com") ||
      host.includes("seatgeek.")
    );
  } catch {
    return false;
  }
}
