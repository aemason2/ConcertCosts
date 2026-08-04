"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ThemeSelector } from "@/components/ThemeSelector";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();

    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      setLoading(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      setMessage(
        "Account created! If email confirmation is on, check your inbox. Otherwise you can log in now."
      );
      setMode("login");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="card w-full max-w-md bg-base-100/95 shadow-2xl border border-base-300 backdrop-blur">
      <div className="card-body gap-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-primary font-semibold">
              Concert Cost Tracker
            </p>
            <h1 className="font-display text-3xl font-bold mt-1">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm opacity-70 mt-2">
              {mode === "login"
                ? "Log in to see your shows, spending, and fun scores."
                : "Sign up free — your concerts stay private to you."}
            </p>
          </div>
          <ThemeSelector className="shrink-0" />
        </div>

        <div className="tabs tabs-boxed bg-base-200 p-1">
          <button
            type="button"
            className={`tab flex-1 ${mode === "login" ? "tab-active" : ""}`}
            onClick={() => {
              setMode("login");
              setError(null);
              setMessage(null);
            }}
          >
            Log in
          </button>
          <button
            type="button"
            className={`tab flex-1 ${mode === "signup" ? "tab-active" : ""}`}
            onClick={() => {
              setMode("signup");
              setError(null);
              setMessage(null);
            }}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-[5.5rem_1fr] items-center gap-x-3 gap-y-3">
            <label htmlFor="email" className="text-sm font-medium text-right">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="input input-bordered w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />

            <label htmlFor="password" className="text-sm font-medium text-right">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={6}
              className="input input-bordered w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>

          {error ? (
            <div className="alert alert-error text-sm py-2">
              <span>{error}</span>
            </div>
          ) : null}
          {message ? (
            <div className="alert alert-success text-sm py-2">
              <span>{message}</span>
            </div>
          ) : null}

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? <span className="loading loading-spinner" /> : null}
            {mode === "login" ? "Log in" : "Sign up"}
          </button>
        </form>
      </div>
    </div>
  );
}
