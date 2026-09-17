import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { BookVisitModal } from "@/components/BookVisitModal";
import { PropertyGallery } from "@/components/PropertyGallery";
import { MapPin, BedDouble, Bath, Maximize, FolderOpen, Calendar, Phone, Package, Moon } from "lucide-react";
import { formatUGX, formatArea, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      landlord: { select: { id: true, name: true, email: true, avatar: true, phone: true } },
      images: { orderBy: { isCover: "desc" } },
    },
  });

  if (!property || property.status !== "ACTIVE") notFound();

  const isRent = property.listingType === "RENT";

  const details = [
    { icon: BedDouble, label: "Bedrooms", value: String(property.bedrooms) },
    { icon: Bath, label: "Bathrooms", value: String(property.bathrooms) },
    { icon: Maximize, label: "Area", value: formatArea(property.areaSqm) },
    { icon: FolderOpen, label: "Listing type", value: isRent ? "For rent (monthly)" : "For sale" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav className="mb-4 text-xs text-slate-500">
        <a href="/properties" className="hover:text-brand-700">Properties</a>
        <span className="mx-1.5">/</span>
        <span className="text-slate-700">{property.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <PropertyGallery images={property.images.map((i) => i.url)} videoUrl={property.videoUrl} />

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900">About this property</h3>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{property.description}</p>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {details.map((d) => (
                <div key={d.label} className="rounded-xl bg-slate-50 p-4 text-center">
                  <d.icon className="mx-auto size-5 text-brand-600" />
                  <p className="mt-2 text-sm font-bold text-slate-900">{d.value}</p>
                  <p className="text-xs text-slate-500">{d.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800">
                <MapPin className="size-3.5" /> {property.address}, {property.city}{property.province ? `, ${property.province}` : ""}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                <Calendar className="size-3.5" /> Listed {timeAgo(property.createdAt)}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900">Meet the owner</h3>
            <div className="mt-4 flex items-center gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-full bg-brand-100 text-lg font-bold text-brand-800">
                {property.landlord.name.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <p className="font-semibold text-slate-900">{property.landlord.name}</p>
                <p className="text-sm text-slate-500">Verified listing owner</p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                <Package className="size-3.5" /> Verified by Pangisaug
              </span>
            </div>
            {property.landlord.phone && (
              <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                <Phone className="size-4 text-brand-600" /> {property.landlord.phone}
              </p>
            )}
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Price</p>
            <p className="mt-1 text-3xl font-bold text-brand-700">
              {formatUGX(property.price)}
              {isRent && <span className="text-base font-medium text-slate-500"> / month</span>}
            </p>
            <p className="mt-2 text-xs text-slate-500">Price negotiable with the owner</p>

            <div className="my-5 h-px bg-slate-100" />

            <BookVisitModal propertyId={property.id} propertyTitle={property.title} />
            <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-500">
              <Moon className="mt-0.5 size-3.5 shrink-0" />
              Booking is free. The owner confirms your preferred time from their dashboard.
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h4 className="flex items-center gap-2 text-sm font-bold text-amber-900">
              <ShieldIcon /> Pangisaug guarantee
            </h4>
            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-amber-800">
              <li>• Owner verified after listing payment</li>
              <li>• Photos & video checked by Pangisaug</li>
              <li>• Direct dealing — no hidden commissions</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
      <path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}