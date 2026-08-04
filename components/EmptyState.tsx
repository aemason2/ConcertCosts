import Link from "next/link";

export function EmptyState({
  message = "No concerts logged yet. Add your first concert to start seeing your dashboard.",
}: {
  message?: string;
}) {
  return (
    <div className="card bg-base-200 border border-base-300">
      <div className="card-body items-center text-center gap-4 py-12">
        <div className="text-5xl opacity-40" aria-hidden>
          ♪
        </div>
        <p className="max-w-md opacity-80">{message}</p>
        <Link href="/add" className="btn btn-primary">
          Add your first concert
        </Link>
      </div>
    </div>
  );
}
