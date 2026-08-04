import { createClient } from "@/lib/supabase/server";
import type { Concert } from "@/lib/types";
import { DashboardView } from "@/components/DashboardView";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("concerts")
    .select("*")
    .order("concert_date", { ascending: false });

  if (error) {
    return (
      <div className="alert alert-error">
        <span>Could not load concerts: {error.message}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-display font-bold">Dashboard</h2>
        <p className="text-sm opacity-70">
          Your concert spending at a glance — including a pie chart of spend by category.
        </p>
      </div>
      <DashboardView concerts={(data ?? []) as Concert[]} />
    </div>
  );
}
