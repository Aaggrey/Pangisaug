import { NextResponse } from "next/server";
import { findPropertyById, updateProperty } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const { id } = await params;
  const { featured } = await req.json();

  const property = await findPropertyById(id);
  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await updateProperty(id, { featured: Boolean(featured) });
  return NextResponse.json({ property: updated });
}
