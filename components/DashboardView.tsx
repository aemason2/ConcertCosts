"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Concert } from "@/lib/types";
import {
  categoryTotals,
  costPerHour,
  formatMoney,
  formatNumber,
  funPointsPer100,
  totalCost,
} from "@/lib/metrics";
import { EmptyState } from "@/components/EmptyState";

const CHART_COLORS = [
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
  "#f97316",
  "#64748b",
];

export function DashboardView({ concerts }: { concerts: Concert[] }) {
  if (concerts.length === 0) {
    return <EmptyState />;
  }

  const withMetrics = concerts.map((c) => ({
    concert: c,
    total: totalCost(c),
    perHour: costPerHour(c),
    funPer100: funPointsPer100(c),
  }));

  const totalSpent = withMetrics.reduce((s, m) => s + m.total, 0);
  const avgCost = totalSpent / concerts.length;
  const avgFun =
    concerts.reduce((s, c) => s + Number(c.fun_rating), 0) / concerts.length;
  const perHourValues = withMetrics
    .map((m) => m.perHour)
    .filter((v): v is number => v != null);
  const avgPerHour =
    perHourValues.length > 0
      ? perHourValues.reduce((a, b) => a + b, 0) / perHourValues.length
      : null;

  const bestValue = [...withMetrics]
    .filter((m) => m.funPer100 != null)
    .sort((a, b) => (b.funPer100 ?? 0) - (a.funPer100 ?? 0))[0];
  const mostExpensive = [...withMetrics].sort((a, b) => b.total - a.total)[0];
  const highestFun = [...concerts].sort(
    (a, b) => Number(b.fun_rating) - Number(a.fun_rating)
  )[0];

  const categoryData = categoryTotals(concerts)
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total)
    .map((c) => ({
      ...c,
      total: Number(c.total.toFixed(2)),
      percent: totalSpent > 0 ? (c.total / totalSpent) * 100 : 0,
    }));

  const costByConcert = withMetrics.map((m) => ({
    name: truncate(m.concert.artist, 16),
    total: Number(m.total.toFixed(2)),
  }));
  const funByConcert = concerts.map((c) => ({
    name: truncate(c.artist, 16),
    fun: Number(c.fun_rating),
  }));
  const valueByConcert = withMetrics
    .filter((m) => m.funPer100 != null)
    .map((m) => ({
      name: truncate(m.concert.artist, 16),
      value: Number((m.funPer100 ?? 0).toFixed(2)),
    }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total concerts" value={String(concerts.length)} />
        <StatCard title="Total spent" value={formatMoney(totalSpent)} />
        <StatCard title="Avg cost / concert" value={formatMoney(avgCost)} />
        <StatCard title="Avg fun rating" value={`${formatNumber(avgFun, 1)} / 10`} />
        <StatCard
          title="Avg cost per hour"
          value={avgPerHour == null ? "—" : formatMoney(avgPerHour)}
        />
        <StatCard
          title="Best value"
          value={bestValue?.concert.artist ?? "—"}
          subtitle={
            bestValue?.funPer100 != null
              ? `${formatNumber(bestValue.funPer100, 2)} pts / $100`
              : undefined
          }
        />
        <StatCard
          title="Most expensive"
          value={mostExpensive?.concert.artist ?? "—"}
          subtitle={mostExpensive ? formatMoney(mostExpensive.total) : undefined}
        />
        <StatCard
          title="Highest fun"
          value={highestFun?.artist ?? "—"}
          subtitle={highestFun ? `${highestFun.fun_rating} / 10` : undefined}
        />
      </div>

      {/* Featured homescreen pie: overall spending by category */}
      <section className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body gap-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <h3 className="card-title text-xl">Overall spending by category</h3>
              <p className="text-sm opacity-70">
                How your total concert spend breaks down across tickets, fees, food, travel, and more.
              </p>
            </div>
            <div className="stat bg-primary/10 rounded-box px-4 py-2 w-fit">
              <div className="stat-title text-xs">All-time total</div>
              <div className="stat-value text-2xl text-primary">{formatMoney(totalSpent)}</div>
            </div>
          </div>

          {categoryData.length === 0 ? (
            <p className="opacity-70 text-sm">No spending amounts logged yet.</p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr] items-center">
              <div className="w-full min-h-[320px]">
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={110}
                      paddingAngle={2}
                      label={false}
                    >
                      {categoryData.map((_, i) => (
                        <Cell
                          key={categoryData[i].key}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [
                        formatMoney(Number(value)),
                        String(name),
                      ]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      wrapperStyle={{ fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                {categoryData.map((row, i) => (
                  <div
                    key={row.key}
                    className="flex items-center justify-between gap-3 rounded-box bg-base-200/70 px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <span className="text-sm truncate">{row.name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold text-sm">{formatMoney(row.total)}</div>
                      <div className="text-xs opacity-60">
                        {formatNumber(row.percent, 1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Total cost by concert">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={costByConcert} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatMoney(Number(v))} />
              <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Fun rating by concert">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={funByConcert} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="fun" fill="#ec4899" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Fun Points per $100 by concert">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={valueByConcert} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatNumber(Number(v), 2)} />
              <Bar dataKey="value" fill="#14b8a6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="stats shadow-sm bg-base-100 border border-base-300 w-full">
      <div className="stat py-3 px-4 gap-1">
        <div className="stat-title text-xs">{title}</div>
        <div className="stat-value text-lg sm:text-xl leading-tight break-words">
          {value}
        </div>
        {subtitle ? <div className="stat-desc">{subtitle}</div> : null}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm">
      <div className="card-body">
        <h3 className="card-title text-base">{title}</h3>
        <div className="w-full min-h-[280px]">{children}</div>
      </div>
    </div>
  );
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
