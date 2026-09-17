import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { EditPropertyForm } from "@/components/dashboard/EditPropertyForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit property — Pangisaug" };

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?callbackUrl=/dashboard");

  const { id } = await params;
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) notFound();

  const isAdmin = user.role === "ADMIN";
  const isOwner = property.landlordId === user.id;
  if (!isAdmin && !isOwner) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav className="mb-4 text-xs text-slate-500">
        <Link href="/dashboard?tab=properties" className="hover:text-brand-700">Dashboard</Link>
        <span className="mx-1.5">/</span>
        <span className="text-slate-700">Edit property</span>
      </nav>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          {isAdmin ? "Edit property (admin)" : "Edit property"}
        </h1>
        <p className="mt-1 text-slate-600">
          Update the details, photos, or video for this listing. Changes go live immediately.
        </p>
      </div>
      <EditPropertyForm propertyId={id} isAdmin={isAdmin} />
    </div>
  );
}