import Link from "next/link";
import { findProperties, countProperties, distinctCities } from "@/lib/db";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyFilters } from "@/components/PropertyFilters";
import { Building2, FolderOpen } from "lucide-react";
import type { ListingType, PropertyWithRelations } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Properties — Pangisaug" };

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const location = sp.location?.trim() || undefined;
  const type = sp.type as ListingType | undefined;
  const bedrooms =
    sp.bedrooms && sp.bedrooms !== "0" ? parseInt(sp.bedrooms, 10) || undefined : undefined;
  const min =
    sp.min && sp.min !== "0" ? parseInt(sp.min, 10) || undefined : undefined;
  const max = sp.max ? parseInt(sp.max, 10) || undefined : undefined;

  const properties = await findProperties({
    status: "ACTIVE",
    listingType: type === "SALE" || type === "RENT" ? type : undefined,
    q,
    location,
    bedrooms,
    min,
    max,
    includeLandlord: true,
    includeImages: true,
    orderBy: "createdAtDesc",
    take: 100,
  });

  const [cities, total] = await Promise.all([distinctCities(), countProperties({ status: "ACTIVE" })]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-600">Pangisaug listings</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Explore properties</h1>
        <p className="mt-1 text-slate-600">
          Verified listings from property owners across the Philippines.
        </p>
      </header>

      <PropertyFilters
        initialQ={q ?? ""}
        initialLocation={location ?? ""}
        initialType={type ?? ""}
        initialBedrooms={sp.bedrooms ?? ""}
        initialMin={sp.min ?? ""}
        initialMax={sp.max ?? ""}
        cities={cities}
      />

      {properties.length > 0 ? (
        <>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p as PropertyWithRelations} />
            ))}
          </div>
          <p className="mt-10 text-center text-sm text-slate-500">
            Showing {properties.length} of {total.toLocaleString()} properties
          </p>
        </>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-14 text-center">
          <Building2 className="mx-auto size-10 text-slate-400" />
          <h2 className="mt-4 text-lg font-semibold text-slate-900">No properties match</h2>
          <p className="mt-1 text-sm text-slate-600">
            Try adjusting your filters or clearing the search to see more listings.
          </p>
          <Link
            href="/properties"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            <FolderOpen className="size-4" /> Clear filters
          </Link>
        </div>
      )}
    </div>
  );
}
