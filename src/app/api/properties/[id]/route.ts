import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      landlord: { select: { id: true, name: true, email: true, avatar: true, phone: true } },
      images: { orderBy: { isCover: "desc" } },
    },
  });
  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ property });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const property = await prisma.property.findUnique({ where: { id } });
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

  const data: Record<string, unknown> = {};
  for (const k of allowed) {
    if (body[k] !== undefined) data[k] = body[k];
  }

  if (Array.isArray(body.images)) {
    await prisma.propertyImage.deleteMany({ where: { propertyId: id } });
    data.images = {
      create: (body.images as { url: string; isCover?: boolean }[]).map((img, idx) => ({
        url: img.url,
        isCover: idx === 0,
      })),
    };
  }

  const updated = await prisma.property.update({
    where: { id },
    data,
    include: { images: true },
  });
  return NextResponse.json({ property: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = property.landlordId === user.id;
  const isAdmin = user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "You do not have access" }, { status: 403 });
  }

  await prisma.property.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}