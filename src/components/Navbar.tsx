"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Logo } from "@/components/Logo";
import { Home, Building2, PlusCircle, LayoutDashboard, LogOut, Menu, X, User, MapPin, Phone } from "lucide-react";

const roleLabel: Record<string, string> = {
  ADMIN: "Admin",
  LANDLORD: "Landlord",
  USER: "Member",
};

export function Navbar() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  const role = (session?.user?.role as string) ?? "";
  const initials = (session?.user?.name ?? "?").slice(0, 2).toUpperCase();

  const links = [
    { href: "/", label: "Home" },
    { href: "/properties", label: "Properties" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="bg-slate-950 text-xs text-white">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <span className="flex items-center gap-1.5">
            <MapPin className="size-3.5 text-brand-400" />
            <span className="font-semibold">Kampala, Bukoto</span>
          </span>
          <span className="hidden items-center gap-4 sm:flex">
            <a href="tel:+256772403372" className="flex items-center gap-1.5 transition hover:text-brand-300">
              <Phone className="size-3.5 text-brand-400" /> +256 772 403372
            </a>
            <a href="tel:+256703652751" className="flex items-center gap-1.5 transition hover:text-brand-300">
              <Phone className="size-3.5 text-brand-400" /> +256 703 652751
            </a>
          </span>
          <span className="flex items-center gap-4 sm:hidden">
            <a href="tel:+256772403372" className="flex items-center gap-1" aria-label="Call +256 772 403372">
              <Phone className="size-3.5 text-brand-400" /> +256 772 403372
            </a>
          </span>
        </div>
      </div>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/list-property"
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <PlusCircle className="size-4" /> List Property
          </Link>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {status === "loading" ? (
            <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-100" />
          ) : session ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <span className="grid size-6 place-items-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                  {initials}
                </span>
                {roleLabel[role] ?? "Dashboard"}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700"
              >
                Join now
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="grid size-10 place-items-center rounded-lg text-slate-700 hover:bg-slate-100 md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {l.href === "/" ? (
                  <Home className="size-4" />
                ) : (
                  <Building2 className="size-4" />
                )}
                {l.label}
              </Link>
            ))}
            <Link
              href="/list-property"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <PlusCircle className="size-4" /> List Property
            </Link>

            <div className="my-2 h-px bg-slate-200" />

            {session ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  <LayoutDashboard className="size-4" /> Dashboard
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="size-4" /> Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  <User className="size-4" /> Sign in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="mt-1 rounded-lg bg-brand-600 px-4 py-2.5 text-center text-sm font-medium text-white"
                >
                  Join now
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}