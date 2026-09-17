"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { X, CalendarDays, MapPin, CheckCircle2, Loader2 } from "lucide-react";

const timeSlots = ["09:00 – 10:00", "10:00 – 11:00", "11:00 – 12:00", "14:00 – 15:00", "15:00 – 16:00", "16:00 – 17:00"];

export function BookVisitModal({ propertyId, propertyTitle }: { propertyId: string; propertyTitle: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [visitorName, setVisitorName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(session?.user?.email ?? "");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<{ error?: string; ok?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const minDate = new Date().toISOString().split("T")[0];

  const openModal = () => {
    if (!session) {
      router.push(`/login?callbackUrl=/properties/${propertyId}`);
      return;
    }
    if (session.user.role === "LANDLORD") {
      setMessage({ error: "Landlords manage visits from their dashboard instead." });
      return;
    }
    setOpen(true);
  };

  const submit = async () => {
    setMessage(null);
    if (!visitorName || !phone || !date || !timeSlot) {
      setMessage({ error: "Please fill in name, phone, date, and time slot." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, visitorName, phone, email, preferredDate: date, timeSlot, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setMessage({ ok: "Visit booked! The landlord has been notified. Check your dashboard." });
      setVisitorName(""); setPhone(""); setDate(""); setTimeSlot(""); setNotes("");
      setTimeout(() => setOpen(false), 1500);
    } catch (e) {
      setMessage({ error: e instanceof Error ? e.message : "Failed to book" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={openModal}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700"
      >
        <CalendarDays className="size-4" /> Book a visit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Book a visit</h3>
                <p className="text-sm text-slate-500 line-clamp-1">{propertyTitle}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid size-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-500">Full name</span>
                  <input
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-500">Phone</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09xx xxx xxxx"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-500">Email</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-500">Preferred date</span>
                <input
                  type="date"
                  min={minDate}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </label>

              <div>
                <span className="mb-1.5 block text-xs font-semibold text-slate-500">Time slot</span>
                <div className="grid grid-cols-2 gap-2">
                  {timeSlots.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTimeSlot(t)}
                      className={`rounded-xl border px-3 py-2 text-center text-xs font-medium transition ${
                        timeSlot === t
                          ? "border-brand-600 bg-brand-600 text-white"
                          : "border-slate-200 text-slate-600 hover:border-brand-300 hover:bg-brand-50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-500">Notes (optional)</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Anything the owner should know…"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </label>

              {message?.error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{message.error}</p>
              )}
              {message?.ok && (
                <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  <CheckCircle2 className="size-4 shrink-0" /> {message.ok}
                </p>
              )}

              <button
                onClick={submit}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-brand-700 disabled:opacity-60"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <CalendarDays className="size-4" />}
                {loading ? "Booking…" : "Confirm booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}