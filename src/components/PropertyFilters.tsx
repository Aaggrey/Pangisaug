"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, BedDouble, Search, X } from "lucide-react";

interface Props {
  initialQ: string;
  initialLocation: string;
  initialType: string;
  initialBedrooms: string;
  initialMin: string;
  initialMax: string;
  cities: string[];
}

export function PropertyFilters({
  initialQ,
  initialLocation,
  initialType,
  initialBedrooms,
  initialMin,
  initialMax,
  cities,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(initialQ);
  const [location, setLocation] = useState(initialLocation);
  const [type, setType] = useState(initialType);
  const [bedrooms, setBedrooms] = useState(initialBedrooms);
  const [min, setMin] = useState(initialMin);
  const [max, setMax] = useState(initialMax);

  const apply = (overrides?: Record<string, string>) => {
    const params = new URLSearchParams();
    const vals = { q, location, type, bedrooms, min, max, ...overrides };
    if (vals.q) params.set("q", vals.q);
    if (vals.location) params.set("location", vals.location);
    if (vals.type) params.set("type", vals.type);
    if (vals.bedrooms) params.set("bedrooms", vals.bedrooms);
    if (vals.min) params.set("min", vals.min);
    if (vals.max) params.set("max", vals.max);
    startTransition(() => router.push(`/properties?${params.toString()}`));
  };

  const reset = () => {
    setQ(""); setLocation(""); setType(""); setBedrooms(""); setMin(""); setMax("");
    startTransition(() => router.push("/properties"));
  };

  const hasFilters = q || location || type || bedrooms || min || max;

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
        <label className="block lg:col-span-2">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Keyword</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && apply()}
            placeholder="Search title or area…"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </label>

        <label className="block">
          <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-500">
            <MapPin className="size-3" /> Location
          </span>
          <input
            list="cities"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && apply()}
            placeholder="City or province"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <datalist id="cities">
            {cities.map((c) => <option key={c} value={c} />)}
          </datalist>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500"
          >
            <option value="">All</option>
            <option value="RENT">For rent</option>
            <option value="SALE">For sale</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-500">
            <BedDouble className="size-3" /> Bedrooms
          </span>
          <select
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500"
          >
            <option value="">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5+</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Price (UGX)</span>
          <div className="flex items-center gap-1.5">
            <input
              value={min}
              onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && apply()}
              placeholder="Min"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500"
            />
            <span className="text-slate-400">–</span>
            <input
              value={max}
              onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && apply()}
              placeholder="Max"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand-500"
            />
          </div>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => apply()}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-brand-600/25 transition hover:bg-brand-700"
        >
          <Search className="size-4" /> Apply filters
        </button>
        {hasFilters && (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <X className="size-4" /> Clear all
          </button>
        )}
      </div>
    </div>
  );
}