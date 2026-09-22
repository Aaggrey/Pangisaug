import Link from "next/link";
import {
  findProperties,
  countProperties,
} from "@/lib/db";
import type { PropertyWithRelations } from "@/lib/types";
import { HeroSlider } from "@/components/HeroSlider";
import { SearchBox } from "@/components/SearchBox";
import { PropertyCard } from "@/components/PropertyCard";
import { ArrowRight, ShieldCheck, Wallet, Video, Home as HomeIcon, Building2 } from "lucide-react";
import { formatUGX } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [featured, recent, total] = await Promise.all([
    findProperties({
      status: "ACTIVE",
      featuredOnly: true,
      take: 3,
      orderBy: "featuredDesc",
      includeLandlord: true,
      includeImages: true,
    }),
    findProperties({
      status: "ACTIVE",
      take: 6,
      orderBy: "createdAtDesc",
      includeLandlord: true,
      includeImages: true,
    }),
    countProperties({ status: "ACTIVE" }),
  ]);

  return (
    <>
      <section className="relative">
        <HeroSlider />
        <SearchBox />
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "Verified owners", text: "Every landlord confirms payment before a listing goes live." },
              { icon: Wallet, title: "Simple listing fee", text: "One flat UGX 100,000 fee unlocks your listing — no hidden costs." },
              { icon: Video, title: "Photos + video", text: "Show off your property with multiple photos and a walkthrough video." },
            ].map((f) => (
              <div key={f.title} className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700">
                  <f.icon className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="py-16 pt-0">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-brand-600">Handpicked</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Featured properties</h2>
              </div>
              <Link
                href="/properties"
                className="hidden items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 sm:flex"
              >
                Browse all <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p) => (
                <PropertyCard key={p.id} property={p as PropertyWithRelations} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-600">Just added</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Latest listings</h2>
            </div>
            <Link
              href="/properties"
              className="hidden items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 sm:flex"
            >
              Browse all <ArrowRight className="size-4" />
            </Link>
          </div>
          {recent.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((p) => (
                <PropertyCard key={p.id} property={p as PropertyWithRelations} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
              <Building2 className="mx-auto size-10 text-slate-400" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900">No listings yet</h3>
              <p className="mt-1 text-sm text-slate-600">
                Be the first owner to feature a property on Pangisaug.
              </p>
              <Link
                href="/list-property"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700"
              >
                List your property <ArrowRight className="size-4" />
              </Link>
            </div>
          )}
          {total > 0 && (
            <p className="mt-8 text-center text-sm text-slate-500">
              {total.toLocaleString()} verified {total === 1 ? "property" : "properties"} available now on Pangisaug
            </p>
          )}
        </div>
      </section>
    </>
  );
}
