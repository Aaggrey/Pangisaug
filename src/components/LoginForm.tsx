"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, Lock, Mail } from "lucide-react";

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29a11.99 11.99 0 0 0 0 10.76l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (!res || res.error) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch {
      setGoogleLoading(false);
      setError("Google sign-in failed. Please try again.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
        <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-600">Sign in to manage properties, bookings, and more.</p>

        <button
          type="button"
          onClick={googleLogin}
          disabled={googleLoading}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-300 bg-white py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
        >
          {googleLoading ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
          {googleLoading ? "Redirecting…" : "Continue with Google"}
        </button>

        <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          or
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-500">Email</span>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                placeholder="you@example.com"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-500">Password</span>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                placeholder="••••••••"
              />
            </div>
          </label>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-bold text-white shadow-md shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-60"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 rounded-xl bg-slate-50 p-4 text-xs text-slate-600">
          <p className="font-semibold text-slate-700">Demo accounts</p>
          <p className="mt-1">Admin — admin@pangisaug.com / admin123</p>
          <p>Landlord — landlord@pangisaug.com / landlord123</p>
          <p>Member — user@pangisaug.com / user123</p>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-brand-700 hover:text-brand-800">
          Create one
        </Link>
      </p>
    </div>
  );
}