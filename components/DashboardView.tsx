"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
  "oklch(var(--p))",
  "oklch(var(--s))",
  "oklch(var(--a))",
  "oklch(var(--in))",
  "oklch(var(--su))",
  "oklch(var(--wa))",
  "oklch(var(--er))",
  "hsl(var(--bc) / 0.45)",
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

  const categoryData = categoryTotals(concerts).filter((c) => c.total > 0);
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

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Spending by cost category">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
              >
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatMoney(Number(v))} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Total cost by concert">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={costByConcert} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatMoney(Number(v))} />
              <Bar dataKey="total" fill="oklch(var(--p))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Fun rating by concert">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={funByConcert} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="fun" fill="oklch(var(--s))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Fun Points per $100 by concert">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={valueByConcert} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatNumber(Number(v), 2)} />
              <Bar dataKey="value" fill="oklch(var(--a))" radius={[6, 6, 0, 0]} />
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
