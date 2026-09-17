import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyFilters } from "@/components/PropertyFilters";
import { Building2 } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Properties — Pangisaug" };

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim().toLowerCase();
  const location = sp.location?.trim().toLowerCase();
  const typeFilter = sp.type;
  const bedrooms = sp.bedrooms && sp.bedrooms !== "0" ? parseInt(sp.bedrooms, 10) : null;
  const min = sp.min ? parseInt(sp.min, 10) : null;
  const max = sp.max ? parseInt(sp.max, 10) : null;

  const where: NonNullable<Parameters<typeof prisma.property.findMany>[0]>["where"] = {
    status: "ACTIVE",
    ...(typeFilter === "SALE" || typeFilter === "RENT" ? { listingType: typeFilter } : {}),
    ...(location
      ? {
          OR: [
            { city: { contains: location } },
            { province: { contains: location } },
            { address: { contains: location } },
          ],
        }
      : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
            { city: { contains: q } },
          ],
        }
      : {}),
    ...(bedrooms ? { bedrooms: { gte: bedrooms } } : {}),
    ...(min ? { price: { gte: min } } : {}),
    ...(max ? { price: { lte: max } } : {}),
  };

  const [properties, cities] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      include: {
        landlord: { select: { id: true, name: true, email: true, avatar: true } },
        images: { orderBy: { isCover: "desc" } },
      },
    }),
    prisma.property.findMany({
      where: { status: "ACTIVE" },
      select: { city: true },
      distinct: ["city"],
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Explore properties</h1>
        <p className="mt-1 text-slate-600">
          Verified listings from property owners across the Philippines.
        </p>
      </div>

      <PropertyFilters
        initialQ={sp.q ?? ""}
        initialLocation={sp.location ?? ""}
        initialType={sp.type ?? ""}
        initialBedrooms={sp.bedrooms ?? ""}
        initialMin={sp.min ?? ""}
        initialMax={sp.max ?? ""}
        cities={cities.map((c) => c.city)}
      />

      {properties.length > 0 ? (
        <>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
          <p className="mt-10 text-center text-sm text-slate-500">
            Showing {properties.length} propert{properties.length === 1 ? "y" : "ies"}
          </p>
        </>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-14 text-center">
          <Building2 className="mx-auto size-10 text-slate-400" />
          <h2 className="mt-4 text-lg font-semibold text-slate-900">No properties match your search</h2>
          <p className="mt-1 text-sm text-slate-600">Try adjusting your filters or clearing the search.</p>
          <Link
            href="/properties"
            className="mt-5 inline-flex rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Reset filters
          </Link>
        </div>
      )}
    </div>
  );
}