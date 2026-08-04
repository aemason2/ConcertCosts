import type { Concert } from "@/lib/types";
import { COST_FIELDS } from "@/lib/types";
import {
  costPerHour,
  formatMoney,
  formatNumber,
  funPointsPer100,
  toNumber,
  totalCost,
} from "@/lib/metrics";
import { EmptyState } from "@/components/EmptyState";

export function ConcertList({ concerts }: { concerts: Concert[] }) {
  if (concerts.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid gap-4">
      {concerts.map((concert) => {
        const total = totalCost(concert);
        const perHour = costPerHour(concert);
        const funPer100 = funPointsPer100(concert);
        const mainCosts = COST_FIELDS.filter((f) => toNumber(concert[f.key]) > 0);

        return (
          <article
            key={concert.id}
            className="card bg-base-100 border border-base-300 shadow-sm"
          >
            <div className="card-body gap-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <h3 className="card-title text-xl">{concert.artist}</h3>
                  <p className="text-sm opacity-60 mt-1">
                    {concert.venue} · {concert.city}, {concert.state}
                  </p>
                  <p className="text-sm opacity-60">
                    {new Date(concert.concert_date + "T00:00:00").toLocaleDateString(
                      "en-US",
                      { year: "numeric", month: "long", day: "numeric" }
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="badge badge-primary badge-lg">
                    {formatMoney(total)}
                  </div>
                  <div className="badge badge-secondary badge-lg">
                    Fun {concert.fun_rating}/10
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatChip
                  label="Cost per hour"
                  value={perHour == null ? "—" : formatMoney(perHour)}
                />
                <StatChip
                  label="Fun Points per $100"
                  value={funPer100 == null ? "—" : formatNumber(funPer100, 2)}
                />
                <StatChip
                  label="Hours at event"
                  value={`${formatNumber(toNumber(concert.hours_at_event), 1)} hrs`}
                />
              </div>

              {mainCosts.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide opacity-50 mb-2">
                    Main cost categories
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {mainCosts.map((f) => (
                      <span key={f.key} className="badge badge-outline">
                        {f.label}: {formatMoney(toNumber(concert[f.key]))}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {concert.notes ? (
                <p className="text-sm bg-base-200 rounded-lg p-3 opacity-90">
                  {concert.notes}
                </p>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-box bg-base-200 px-3 py-2">
      <div className="text-xs opacity-60">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
