import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="login-hero min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 gap-8">
        <div className="text-center max-w-2xl">
          <p className="text-sm tracking-[0.25em] uppercase opacity-70 mb-3">
            Your shows · Your spend · Your fun
          </p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
            Concert Cost Tracker
          </h1>
          <p className="mt-4 text-base sm:text-lg opacity-80 max-w-lg mx-auto">
            Log every ticket, taco, and T-shirt — then see which concerts were actually worth it.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
