import Link from "next/link";
import Image from "next/image";
import { MapPin, BedDouble, Bath, Maximize } from "lucide-react";
import type { PropertyWithRelations } from "@/lib/types";
import { formatUGX, formatArea } from "@/lib/format";

export function PropertyCard({ property }: { property: PropertyWithRelations }) {
  const cover = property.images[0]?.url ?? "/uploads/images/prop-1.svg";
  const isRent = property.listingType === "RENT";

  return (
    <Link
      href={`/properties/${property.id}`}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={cover}
          alt={property.title}
          fill
          className="object-cover transition duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <span
          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm ${
            isRent ? "bg-sky-600" : "bg-brand-600"
          }`}
        >
          {isRent ? "For Rent" : "For Sale"}
        </span>
        {property.featured && (
          <span className="absolute right-3 top-3 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950 shadow-sm">
            ★ Featured
          </span>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div>
          <p className="text-lg font-bold text-brand-700">
            {formatUGX(property.price)}
            {isRent && <span className="text-sm font-medium text-slate-500">/mo</span>}
          </p>
          <h3 className="mt-0.5 line-clamp-1 text-sm font-semibold text-slate-900 group-hover:text-brand-700">
            {property.title}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="size-3.5" />
            <span className="line-clamp-1">{property.city}{property.province ? `, ${property.province}` : ""}</span>
          </p>
        </div>

        <div className="flex items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <BedDouble className="size-4 text-brand-600" /> {property.bedrooms} bd
          </span>
          <span className="flex items-center gap-1.5">
            <Bath className="size-4 text-brand-600" /> {property.bathrooms} ba
          </span>
          <span className="flex items-center gap-1.5">
            <Maximize className="size-4 text-brand-600" /> {formatArea(property.areaSqm)}
          </span>
        </div>
      </div>
    </Link>
  );
}