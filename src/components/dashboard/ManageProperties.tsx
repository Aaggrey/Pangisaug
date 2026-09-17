"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Star, RefreshCw, Loader2, CheckCircle2, Pencil } from "lucide-react";
import { formatUGX, timeAgo } from "@/lib/format";

interface Prop {
  id: string;
  title: string;
  price: number;
  city: string;
  status: string;
  listingType: string;
  featured: boolean;
  createdAt: string;
  videoUrl?: string | null;
  images: { id: string; url: string; isCover: boolean }[];
}

export function ManageProperties({ role }: { role: string }) {
  const [items, setItems] = useState<Prop[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/properties/manager");
    const data = await res.json();
    setItems(data.properties);
  };

  useEffect(() => {
    load();
  }, []);

  const action = async (id: string, body: Record<string, unknown>, okText: string) => {
    setMessage(null);
    const res = await fetch(`/api/properties/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = await res.json();
      setMessage(d.error ?? "Action failed");
      return;
    }
    await load();
    setMessage(okText);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this property permanently?")) return;
    const res = await fetch(`/api/properties/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setMessage("Failed to delete");
      return;
    }
    await load();
    setMessage("Property deleted.");
  };

  const payToPublish = async (id: string) => {
    setMessage(null);
    if (!momoPhone) {
      setMessage("Enter the mobile money number to charge.");
      return;
    }
    const res = await fetch("/api/payment/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: id, method, phone: momoPhone }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Payment failed");
      return;
    }
    setPaymentId(data.payment.id);
    setMessage(`Prompt sent to ${data.payment.phone}. Check your phone and approve the charge.`);

    let attempts = 0;
    setPolling(true);
    const poll = async () => {
      attempts += 1;
      try {
        const r = await fetch(`/api/payment/status?paymentId=${data.payment.id}`);
        const d = await r.json();
        if (d.status === "SUCCESS") {
          setPolling(false);
          setMessage("Payment confirmed — your listing is now live!");
          await load();
          return;
        }
        if (d.status === "FAILED") {
          setPolling(false);
          setMessage(d.reason ? `Payment failed: ${d.reason}` : "Payment failed.");
        }
      } catch {
        // keep polling on transient errors
      }
      if (attempts < 40) {
        setTimeout(poll, 4000);
      } else {
        setPolling(false);
        setMessage("We still haven't seen your payment. Check your phone or retry.");
      }
    };
    poll();
  };

  if (!items) {
    return <div className="grid h-40 place-items-center text-slate-400"><Loader2 className="size-5 animate-spin" /></div>;
  }

  const hasVideo = items.some((p) => p.videoUrl);

  return (
    <div className="space-y-4">
      {message && (
        <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="size-4 shrink-0" /> {message}
        </p>
      )}
      {role === "ADMIN" && (
        <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
          As administrator you can feature, activate, pause, or remove any listing.  {hasVideo ? "Media moderation includes images and videos." : ""}
        </p>
      )}

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
          No properties yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Media</th>
                <th className="px-4 py-3">Listed</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((p) => (
                <tr key={p.id} className="align-middle">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg">
                        <Image src={p.images[0]?.url ?? "/uploads/images/prop-1.svg"} alt="" fill className="object-cover" sizes="56px" />
                      </div>
                      <div>
                        <p className="line-clamp-1 font-semibold text-slate-900">{p.title}</p>
                        <p className="text-xs text-slate-500">
                          {p.city} · {p.listingType === "RENT" ? "Rent" : "Sale"}
                          {p.featured && <span className="ml-1.5 font-bold text-amber-600">★</span>}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{formatUGX(p.price)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        p.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700"
                          : p.status === "PENDING_PAYMENT"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {p.status === "PENDING_PAYMENT" ? "Pending payment" : p.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {p.images.length} photo{p.images.length !== 1 ? "s" : ""}
                    {p.videoUrl ? " · 1 video" : ""}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{timeAgo(p.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/dashboard/edit/${p.id}`}
                        title="Edit property"
                        className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-brand-100 hover:text-brand-700"
                      >
                        <Pencil className="size-4" />
                      </Link>
                      {role === "LANDLORD" && p.status === "PENDING_PAYMENT" && (
                        <button
                          onClick={() => payToPublish(p.id)}
                          className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-amber-600"
                        >
                          Pay to publish
                        </button>
                      )}
                      {role === "ADMIN" && (
                        <>
                          <button
                            onClick={() => action(p.id, { featured: !p.featured }, p.featured ? "Unfeatured." : "Featured.")}
                            title={p.featured ? "Unfeature" : "Feature"}
                            className={`grid size-8 place-items-center rounded-lg transition ${
                              p.featured ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500 hover:text-amber-600"
                            }`}
                          >
                            <Star className="size-4" />
                          </button>
                          <button
                            onClick={() =>
                              action(
                                p.id,
                                { status: p.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" },
                                p.status === "ACTIVE" ? "Listing paused." : "Listing activated."
                              )
                            }
                            title={p.status === "ACTIVE" ? "Pause" : "Activate"}
                            className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-sky-100 hover:text-sky-700"
                          >
                            <RefreshCw className="size-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => remove(p.id)}
                        title="Delete"
                        className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-red-100 hover:text-red-600"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}