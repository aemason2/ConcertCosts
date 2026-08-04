"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/metrics";
import type { ExtractedTicketCosts } from "@/lib/ticket-extract";

type Extracted = ExtractedTicketCosts & { source?: string };

type Props = {
  onApply: (costs: {
    ticket_cost: string;
    ticket_fees: string;
    tax_cost: string;
    delivery_cost: string;
  }) => void;
};

export function TicketLinkImporter({ onApply }: Props) {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Extracted | null>(null);
  const [showTextPaste, setShowTextPaste] = useState(false);

  async function extract() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tickets/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim() || undefined,
          text: text.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not extract prices.");
        if (!showTextPaste) setShowTextPaste(true);
        return;
      }
      setResult(data);
      if ((data.warnings?.length ?? 0) > 0) setShowTextPaste(true);
    } catch {
      setError("Network error while extracting ticket prices.");
      setShowTextPaste(true);
    } finally {
      setLoading(false);
    }
  }

  function applyResult(data: Extracted) {
    onApply({
      ticket_cost: String(data.ticket_cost || 0),
      ticket_fees: String(data.ticket_fees || 0),
      tax_cost: String(data.tax_cost || 0),
      delivery_cost: String(data.delivery_cost || 0),
    });
  }

  return (
    <div className="rounded-box border border-primary/30 bg-primary/5 p-4 space-y-3">
      <div>
        <h3 className="font-semibold">Paste a ticket link</h3>
        <p className="text-sm opacity-70">
          Ticketmaster, AXS, or SeatGeek — we’ll try to fill base price, fees, taxes, and delivery.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          className="input input-bordered w-full"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.ticketmaster.com/..."
          inputMode="url"
        />
        <button
          type="button"
          className="btn btn-primary shrink-0"
          disabled={loading || (!url.trim() && !text.trim())}
          onClick={extract}
        >
          {loading ? <span className="loading loading-spinner loading-sm" /> : null}
          Extract prices
        </button>
      </div>

      <button
        type="button"
        className="btn btn-ghost btn-xs"
        onClick={() => setShowTextPaste((v) => !v)}
      >
        {showTextPaste ? "Hide" : "Or paste"} order summary text
      </button>

      {showTextPaste ? (
        <textarea
          className="textarea textarea-bordered w-full min-h-28 text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Example:\nTickets $89.50\nService Fee $18.40\nSales Tax $7.12\nDelivery $2.99`}
        />
      ) : null}

      {error ? (
        <div className="alert alert-warning text-sm py-2">
          <span>{error}</span>
        </div>
      ) : null}

      {result ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-outline capitalize">{result.provider}</span>
            <span
              className={`badge ${
                result.confidence === "high"
                  ? "badge-success"
                  : result.confidence === "medium"
                    ? "badge-warning"
                    : "badge-ghost"
              }`}
            >
              {result.confidence} confidence
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            <Preview label="Base ticket" value={result.ticket_cost} />
            <Preview label="Fees" value={result.ticket_fees} />
            <Preview label="Taxes" value={result.tax_cost} />
            <Preview label="Delivery" value={result.delivery_cost} />
          </div>

          {result.warnings.length > 0 ? (
            <ul className="text-xs opacity-70 list-disc pl-4 space-y-1">
              {result.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          ) : null}

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => applyResult(result)}
          >
            Fill cost fields with these amounts
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Preview({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-box bg-base-100 border border-base-300 px-3 py-2">
      <div className="text-xs opacity-60">{label}</div>
      <div className="font-semibold">{formatMoney(value || 0)}</div>
    </div>
  );
}
