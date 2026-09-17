import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import type { ListingType, PropertyStatus, Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim().toLowerCase();
  const location = searchParams.get("location")?.trim().toLowerCase();
  const bedroomsRaw = searchParams.get("bedrooms");
  const minPrice = searchParams.get("min");
  const maxPrice = searchParams.get("max");
  const type = searchParams.get("type");
  const featured = searchParams.get("featured") === "true";

  const where: Prisma.PropertyWhereInput = {
    status: "ACTIVE",
    ...(type === "SALE" || type === "RENT" ? { listingType: type as ListingType } : {}),
    ...(featured ? { featured: true } : {}),
    ...(location
      ? {
          OR: [
            { city: { contains: location } },
            { province: { contains: location } },
            { address: { contains: location } },
          ],
        }
      : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
            { city: { contains: q } },
            { province: { contains: q } },
          ],
        }
      : {}),
    ...(bedroomsRaw && bedroomsRaw !== "0" ? { bedrooms: { gte: parseInt(bedroomsRaw, 10) } } : {}),
    ...(minPrice ? { price: { gte: parseInt(minPrice, 10) } } : {}),
    ...(maxPrice ? { price: { lte: parseInt(maxPrice, 10) } } : {}),
  };

  const properties = await prisma.property.findMany({
    where,
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    include: {
      landlord: { select: { id: true, name: true, email: true, avatar: true } },
      images: { orderBy: { isCover: "desc" } },
    },
  });

  return NextResponse.json({ properties });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "LANDLORD" && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only landlords can list properties" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      title,
      description,
      price,
      address,
      city,
      province,
      bedrooms,
      bathrooms,
      areaSqm,
      listingType,
      videoUrl,
      images,
    } = body;

    if (!title || !description || !price || !address || !city || !bedrooms) {
      return NextResponse.json({ error: "Please fill in all required fields" }, { status: 400 });
    }
    if (!images || images.length === 0) {
      return NextResponse.json({ error: "At least one image is required" }, { status: 400 });
    }

    const property = await prisma.property.create({
      data: {
        title,
        description,
        price: parseInt(String(price), 10),
        address,
        city,
        province: province || null,
        bedrooms: parseInt(String(bedrooms), 10),
        bathrooms: bathrooms ? parseFloat(String(bathrooms)) : 1,
        areaSqm: areaSqm ? parseFloat(String(areaSqm)) : null,
        listingType: listingType === "RENT" ? "RENT" : "SALE",
        status: user.role === "ADMIN" ? "ACTIVE" : "PENDING_PAYMENT",
        videoUrl: videoUrl || null,
        landlordId: user.id,
        images: {
          create: (images as { url: string; isCover?: boolean }[]).map(
            (img, idx) => ({ url: img.url, isCover: idx === 0 })
          ),
        },
      },
      include: { images: true },
    });

    return NextResponse.json({ property }, { status: 201 });
  } catch (err) {
    console.error("create property", err);
    return NextResponse.json({ error: "Failed to create property" }, { status: 500 });
  }
}