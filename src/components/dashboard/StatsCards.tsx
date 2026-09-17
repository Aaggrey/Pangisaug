"use client";

import { useState, useEffect } from "react";
import { Building2, CalendarCheck2, Wallet, TrendingUp, Loader2 } from "lucide-react";

export function StatsCards() {
  const [stats, setStats] = useState<{
    properties: number;
    bookings: number;
    payments: number;
    totalRevenue: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  if (!stats) {
    return (
      <div className="grid h-28 place-items-center text-slate-400">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  const cards = [
    { icon: Building2, label: "Properties", value: stats.properties, tint: "bg-brand-100 text-brand-700" },
    { icon: CalendarCheck2, label: "Visit bookings", value: stats.bookings, tint: "bg-sky-100 text-sky-700" },
    { icon: Wallet, label: "Payments", value: stats.payments, tint: "bg-amber-100 text-amber-700" },
    { icon: TrendingUp, label: "Revenue (UGX)", value: stats.totalRevenue.toLocaleString(), tint: "bg-emerald-100 text-emerald-700" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className={`grid size-10 place-items-center rounded-xl ${c.tint}`}>
            <c.icon className="size-5" />
          </span>
          <p className="mt-3 text-2xl font-bold text-slate-900">{c.value}</p>
          <p className="text-xs font-medium text-slate-500">{c.label}</p>
        </div>
      ))}
    </div>
  );
}