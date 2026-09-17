"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, Lock, Mail, User as UserIcon, Phone, Check } from "lucide-react";

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

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"USER" | "LANDLORD">("USER");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const googleRegister = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: role === "LANDLORD" ? "/list-property" : "/dashboard" });
    } catch {
      setGoogleLoading(false);
      setError("Google sign-up failed. Please try again.");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Registration failed");

      await signIn("credentials", { email, password, callbackUrl: role === "LANDLORD" ? "/list-property" : "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
        <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-600">Join Pangisaug as a member or property owner.</p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {(
            [
              { value: "USER", title: "Member", text: "Browse & book visits" },
              { value: "LANDLORD", title: "Landlord", text: "List properties for a fee" },
            ] as const
          ).map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={`rounded-xl border p-3 text-left transition ${
                role === r.value
                  ? "border-brand-600 bg-brand-50 ring-2 ring-brand-100"
                  : "border-slate-200 hover:border-brand-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">{r.title}</span>
                {role === r.value && <Check className="size-4 text-brand-600" />}
              </div>
              <p className="mt-0.5 text-xs text-slate-500">{r.text}</p>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={googleRegister}
          disabled={googleLoading}
          className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-300 bg-white py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
        >
          {googleLoading ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
          {googleLoading ? "Redirecting…" : "Continue with Google"}
        </button>

        <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          or sign up with email
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-500">Full name</span>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                placeholder="Juan Dela Cruz"
              />
            </div>
          </label>

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
            <span className="mb-1 block text-xs font-semibold text-slate-500">Phone (optional)</span>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                placeholder="09xx xxx xxxx"
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
                placeholder="Minimum 6 characters"
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
            {loading ? "Creating account…" : role === "LANDLORD" ? "Create landlord account" : "Create account"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-brand-700 hover:text-brand-800">
          Sign in
        </Link>
      </p>
    </div>
  );
}