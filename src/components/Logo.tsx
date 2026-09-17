import Link from "next/link";
import { Building2 } from "lucide-react";

export function Logo({ inverted }: { inverted?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
        <Building2 className="size-5" />
      </span>
      <span className={`text-xl font-bold tracking-tight ${inverted ? "text-white" : "text-slate-900"}`}>
        Pangi<span className="text-brand-600">saug</span>
      </span>
    </Link>
  );
}