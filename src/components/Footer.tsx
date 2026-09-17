import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Globe, Share2, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="space-y-4">
          <Logo inverted />
          <p className="text-sm leading-6">
            Pangisaug is a trusted property directory where serious tenants work directly with landlords to get the properties of their choice.
          </p>
          <div className="flex gap-3">
            <a href="#" aria-label="Website" className="grid size-9 place-items-center rounded-lg bg-white/5 transition hover:bg-white/10">
              <Globe className="size-4" />
            </a>
            <a href="#" aria-label="Share" className="grid size-9 place-items-center rounded-lg bg-white/5 transition hover:bg-white/10">
              <Share2 className="size-4" />
            </a>
            <a href="#" aria-label="Email" className="grid size-9 place-items-center rounded-lg bg-white/5 transition hover:bg-white/10">
              <Mail className="size-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Explore</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/properties" className="transition hover:text-white">All properties</Link></li>
            <li><Link href="/properties?type=SALE" className="transition hover:text-white">For sale</Link></li>
            <li><Link href="/properties?type=RENT" className="transition hover:text-white">For rent</Link></li>
            <li><Link href="/list-property" className="transition hover:text-white">List your property</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Account</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/login" className="transition hover:text-white">Sign in</Link></li>
            <li><Link href="/register" className="transition hover:text-white">Create account</Link></li>
            <li><Link href="/dashboard" className="transition hover:text-white">Dashboard</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Contact us</h4>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0 text-brand-400" /> Kampala, Bukoto
            </li>
            <li>
              <a href="tel:+256772403372" className="flex items-center gap-2 transition hover:text-white">
                <Phone className="size-4 shrink-0 text-brand-400" /> +256 772 403372
              </a>
            </li>
            <li>
              <a href="tel:+256703652751" className="flex items-center gap-2 transition hover:text-white">
                <Phone className="size-4 shrink-0 text-brand-400" /> +256 703 652751
              </a>
            </li>
          </ul>
          <p className="mt-4 border-t border-white/5 pt-4 text-sm leading-6 text-slate-500">
            Landlords pay a one-time listing fee of <span className="font-semibold text-brand-400">UGX 100,000</span>{" "}
            per property. Once confirmed, your listing goes live instantly.
          </p>
        </div>
      </div>
      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Pangisaug Real Estate Directory. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}