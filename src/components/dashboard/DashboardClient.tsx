"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { LayoutDashboard, Building2, CalendarCheck2, Users, Wallet, Image as ImageIcon, PlusCircle } from "lucide-react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ManageUsers } from "@/components/dashboard/ManageUsers";
import { ManageProperties } from "@/components/dashboard/ManageProperties";
import { BookingsList } from "@/components/dashboard/BookingsList";
import { PaymentsList } from "@/components/dashboard/PaymentsList";
import { MediaLibrary } from "@/components/dashboard/MediaLibrary";

const roleName: Record<string, string> = {
  ADMIN: "Administrator",
  LANDLORD: "Landlord",
  USER: "Member",
};

export function DashboardClient({ user }: { user: { name: string; email: string; role: string } }) {
  const role = user.role;
  const isAdmin = role === "ADMIN";
  const isLandlord = role === "LANDLORD";
  const isUser = role === "USER";

  const initialTab = useSearchParams().get("tab") ?? "overview";
  const [tab, setTab] = useState(initialTab);

  const tabs: { key: string; label: string; icon: typeof LayoutDashboard }[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "properties", label: "Properties", icon: Building2 },
    { key: "bookings", label: "Visit bookings", icon: CalendarCheck2 },
    ...(isAdmin
      ? [
          { key: "users", label: "Manage users", icon: Users },
          { key: "media", label: "Media library", icon: ImageIcon },
          { key: "payments", label: "Payments", icon: Wallet },
        ]
      : isLandlord
      ? [{ key: "payments", label: "Payments", icon: Wallet }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-600">
            {roleName[role]} dashboard
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Hello, {user.name.split(" ")[0]}</h1>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
        {(isLandlord || isAdmin) && (
          <a
            href="/list-property"
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/25 transition hover:bg-brand-700"
          >
            <PlusCircle className="size-4" /> List a property
          </a>
        )}
      </div>

      <div className="no-scrollbar mb-8 flex gap-2 overflow-x-auto border-b border-slate-200 pb-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.key
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <t.icon className="size-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-8">
          <StatsCards />
          <div>
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              {isAdmin ? "Latest bookings" : isLandlord ? "Visit requests" : "My visit bookings"}
            </h2>
            <BookingsList role={role} />
          </div>
        </div>
      )}

      {tab === "properties" && <ManageProperties role={role} />}
      {tab === "bookings" && (
        <div>
          <h2 className="mb-4 text-lg font-bold text-slate-900">Visit bookings</h2>
          <BookingsList role={role} />
        </div>
      )}
      {tab === "users" && isAdmin && <ManageUsers />}
      {tab === "media" && isAdmin && <MediaLibrary />}
      {tab === "payments" && (isAdmin || isLandlord) && <PaymentsList role={role} />}
    </div>
  );
}