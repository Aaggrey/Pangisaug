import { NextResponse } from "next/server";
import {
  getPropertyDetail,
  updateProperty,
  deleteProperty,
  replacePropertyImages,
} from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const property = await getPropertyDetail(id);
  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ property });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const property = await getPropertyDetail(id);
  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = property.landlordId === user.id;
  const isAdmin = user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "You do not have access to this property" }, { status: 403 });
  }

  const body = await req.json();
  const allowed = [
    "title",
    "description",
    "price",
    "address",
    "city",
    "province",
    "bedrooms",
    "bathrooms",
    "areaSqm",
    "listingType",
    "videoUrl",
    "status",
    "featured",
  ];

  const data: Partial<{
    title: string;
    description: string;
    price: number;
    address: string;
    city: string;
    province: string | null;
    bedrooms: number;
    bathrooms: number;
    areaSqm: number | null;
    listingType: string;
    videoUrl: string | null;
    status: string;
    featured: boolean;
  }> = {};

  for (const k of allowed) {
    if (body[k] !== undefined) data[k as keyof typeof data] = body[k];
  }

  if (Array.isArray(body.images)) {
    await replacePropertyImages(
      id,
      (body.images as { url: string; isCover?: boolean }[]).map((img, idx) => ({
        url: img.url,
        isCover: idx === 0,
      }))
    );
  }

  const updated = await updateProperty(id, data);
  return NextResponse.json({ property: updated });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const property = await getPropertyDetail(id);
  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = property.landlordId === user.id;
  const isAdmin = user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "You do not have access" }, { status: 403 });
  }

  await deleteProperty(id);
  return NextResponse.json({ ok: true });
}