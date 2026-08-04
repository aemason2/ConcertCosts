import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddConcertForm } from "@/components/AddConcertForm";

export default async function AddConcertPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-display font-bold">Add Concert</h2>
        <p className="text-sm opacity-70">
          Fill in the show details, costs, and how much fun you had. Total cost updates as you type.
        </p>
      </div>
      <AddConcertForm userId={user.id} />
    </div>
  );
}
