"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, CalendarCheck2 } from "lucide-react";

interface Booking {
  id: string;
  visitorName: string;
  phone: string;
  email: string;
  preferredDate: string;
  timeSlot: string;
  notes?: string | null;
  status: string;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
  property: {
    id: string;
    title: string;
    city: string;
    images?: { url: string }[];
    landlord?: { id: string; name: string; email: string };
  };
}

const statusBadge: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-600",
  COMPLETED: "bg-sky-50 text-sky-700",
};

export function BookingsList({ role }: { role: string }) {
  const [items, setItems] = useState<Booking[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/bookings");
    const data = await res.json();
    setItems(data.bookings);
  };

  useEffect(() => {
    load();
  }, []);

  const update = async (id: string, status: string) => {
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setMessage("Failed to update booking");
      return;
    }
    await load();
    setMessage("Booking updated.");
  };

  if (!items) {
    return <div className="grid h-40 place-items-center text-slate-400"><Loader2 className="size-5 animate-spin" /></div>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
        <CalendarCheck2 className="mx-auto size-9 text-slate-400" />
        <h3 className="mt-3 font-semibold text-slate-900">No visit bookings yet</h3>
        {role === "USER" && (
          <p className="mt-1 text-sm text-slate-600">Book a visit from any active property to see it here.</p>
        )}
        {role === "LANDLORD" && (
          <p className="mt-1 text-sm text-slate-600">When buyers book a visit, their request will appear here.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {message && (
        <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="size-4 shrink-0" /> {message}
        </p>
      )}

      {items.map((b) => (
        <div key={b.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-900">{b.property.title}</p>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{b.property.city}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                <span className="font-semibold text-slate-800">{b.visitorName}</span>
                {b.user && b.user.name !== b.visitorName ? <> ({b.user.name})</> : null} · {b.phone} · {b.email}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {b.preferredDate} · {b.timeSlot}
                {b.notes ? <span className="block pt-1 text-slate-400">“{b.notes}”</span> : null}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadge[b.status] ?? "bg-slate-100 text-slate-600"}`}>
              {b.status}
            </span>
          </div>

          {(role === "ADMIN" || role === "LANDLORD") && b.status === "PENDING" && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => update(b.id, "CONFIRMED")}
                className="rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-brand-700"
              >
                Confirm visit
              </button>
              <button
                onClick={() => update(b.id, "CANCELLED")}
                className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Decline
              </button>
            </div>
          )}

          {(role === "ADMIN" || role === "LANDLORD") && b.status === "CONFIRMED" && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <button
                onClick={() => update(b.id, "COMPLETED")}
                className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-slate-700"
              >
                Mark visit completed
              </button>
            </div>
          )}

          {role === "LANDLORD" && b.property.landlord && (
            <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
              Owner: {b.property.landlord.name} ({b.property.landlord.email})
            </p>
          )}
        </div>
      ))}
    </div>
  );
}