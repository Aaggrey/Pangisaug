"use client";

import { useEffect, useState } from "react";
import { Loader2, Wallet } from "lucide-react";
import { formatUGX } from "@/lib/format";

interface Payment {
  id: string;
  reference: string;
  amount: number;
  method: string;
  status: string;
  paidAt: string;
  property: { id: string; title: string };
  landlord: { name: string; email: string };
}

export function PaymentsList({ role }: { role: string }) {
  const [items, setItems] = useState<Payment[] | null>(null);

  useEffect(() => {
    fetch("/api/payments")
      .then((r) => r.json())
      .then((d) => setItems(d.payments))
      .catch(() => setItems([]));
  }, []);

  if (!items) {
    return <div className="grid h-40 place-items-center text-slate-400"><Loader2 className="size-5 animate-spin" /></div>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
        <Wallet className="mx-auto size-9 text-slate-400" />
        <h3 className="mt-3 font-semibold text-slate-900">No payments yet</h3>
        <p className="mt-1 text-sm text-slate-600">Listing fee payments will appear here after confirmation.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Reference</th>
            <th className="px-4 py-3">Property</th>
            {role === "ADMIN" && <th className="px-4 py-3">Owner</th>}
            <th className="px-4 py-3">Method</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Paid at</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">{p.reference}</td>
              <td className="px-4 py-3 text-slate-700">{p.property.title}</td>
              {role === "ADMIN" && (
                <td className="px-4 py-3">
                  <p className="text-slate-700">{p.landlord.name}</p>
                  <p className="text-xs text-slate-500">{p.landlord.email}</p>
                </td>
              )}
              <td className="px-4 py-3 text-slate-600">{p.method}</td>
              <td className="px-4 py-3 font-semibold text-slate-900">{formatUGX(p.amount)}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">{p.status}</span>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {new Date(p.paidAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}