"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ThemeSelector } from "@/components/ThemeSelector";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/add", label: "Add Concert" },
  { href: "/concerts", label: "My Concerts" },
] as const;

export function AppHeader({ email }: { email: string }) {
  const router = useRouter();
  const pathname = usePathname();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-base-300 bg-base-100/80 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 py-4 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-primary">
              Concert Cost Tracker
            </h1>
            <p className="text-sm opacity-70 mt-1 max-w-xl">
              Track what you spend on live shows — and how much fun you got for every dollar.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <ThemeSelector />
            <div className="badge badge-outline badge-lg max-w-[14rem] truncate" title={email}>
              {email}
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
              Log out
            </button>
          </div>
        </div>

        <nav className="tabs tabs-boxed bg-base-200 p-1 w-full sm:w-fit">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`tab flex-1 sm:flex-none ${active ? "tab-active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
