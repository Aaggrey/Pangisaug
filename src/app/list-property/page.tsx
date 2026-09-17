import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { ListPropertyForm } from "@/components/ListPropertyForm";
import { LogIn, UserPlus, ShieldAlert } from "lucide-react";

export const metadata = { title: "List your property — Pangisaug" };

export default async function ListPropertyPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-100 text-brand-700">
            <LogIn className="size-6" />
          </span>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Sign in to list a property</h1>
          <p className="mt-1 text-sm text-slate-600">
            You need a landlord account to post properties on Pangisaug.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/login?callbackUrl=/list-property"
              className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-brand-700"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (user.role === "USER") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-100 text-amber-700">
            <ShieldAlert className="size-6" />
          </span>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Only landlords can list properties</h1>
          <p className="mt-1 text-sm text-slate-600">
            Members can browse and book visits. Create a landlord account to start posting.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-flex rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-brand-700"
          >
            Create a landlord account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          {user.role === "ADMIN" ? "List a property (admin)" : "List your property"}
        </h1>
        <p className="mt-1 text-slate-600">
          {user.role === "ADMIN"
            ? "Admins publish properties directly without a listing fee."
            : "Fill in the details, add photos and a video, then pay the one-time listing fee to go live."}
        </p>
      </div>
      <ListPropertyForm isAdmin={user.role === "ADMIN"} />
    </div>
  );
}