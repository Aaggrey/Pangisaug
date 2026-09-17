"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, BedDouble, Banknote, Search } from "lucide-react";

const priceRanges = [
  { label: "Any price", min: "", max: "" },
  { label: "Under UGX 1M", min: "", max: "999999" },
  { label: "UGX 1M – 5M", min: "1000000", max: "5000000" },
  { label: "UGX 5M – 10M", min: "5000000", max: "9999999" },
  { label: "Over UGX 10M", min: "10000000", max: "" },
];

export function SearchBox() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [location, setLocation] = useState("");
  const [bedrooms, setBedrooms] = useState("0");
  const [price, setPrice] = useState("");

  const search = () => {
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (bedrooms && bedrooms !== "0") params.set("bedrooms", bedrooms);
    const range = priceRanges.find((r) => r.label === price);
    if (range) {
      if (range.min) params.set("min", range.min);
      if (range.max) params.set("max", range.max);
    }
    startTransition(() => router.push(`/properties?${params.toString()}`));
  };

  return (
    <div className="absolute inset-x-0 bottom-[-70px] mx-auto max-w-5xl px-4 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/10 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto]">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <MapPin className="size-3.5 text-brand-600" /> Location
            </span>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="City, province, or area…"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <BedDouble className="size-3.5 text-brand-600" /> Bedrooms
            </span>
            <select
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              <option value="0">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="5">5+</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Banknote className="size-3.5 text-brand-600" /> Price range
            </span>
            <select
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              {priceRanges.map((r) => (
                <option key={r.label}>{r.label}</option>
              ))}
            </select>
          </label>

          <button
            onClick={search}
            className="flex items-center justify-center gap-2 self-end rounded-xl bg-brand-600 px-7 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/25 transition hover:bg-brand-700 active:scale-[0.98]"
          >
            <Search className="size-4" /> Search
          </button>
        </div>
      </div>
    </div>
  );
}