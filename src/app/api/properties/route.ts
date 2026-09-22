import { NextResponse } from "next/server";
import { findProperties, countProperties, distinctCities, createProperty } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import type { ListingType } from "@/lib/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || undefined;
  const location = searchParams.get("location")?.trim() || undefined;
  const bedroomsRaw = searchParams.get("bedrooms");
  const minPriceRaw = searchParams.get("minPrice") ?? searchParams.get("min");
  const maxPriceRaw = searchParams.get("maxPrice") ?? searchParams.get("max");
  const type = searchParams.get("type") as ListingType | null;
  const featured = searchParams.get("featured") === "true";

  const bedrooms = bedroomsRaw && bedroomsRaw !== "0" ? parseInt(bedroomsRaw, 10) || undefined : undefined;
  const minPrice = minPriceRaw && minPriceRaw !== "0" ? parseInt(minPriceRaw, 10) || undefined : undefined;
  const maxPrice = maxPriceRaw ? parseInt(maxPriceRaw, 10) || undefined : undefined;

  const [properties, total, cities] = await Promise.all([
    findProperties({
      status: "ACTIVE",
      listingType: type === "SALE" || type === "RENT" ? type : undefined,
      featuredOnly: featured || undefined,
      bedrooms,
      min: minPrice,
      max: maxPrice,
      q,
      location,
      includeLandlord: true,
      includeImages: true,
      orderBy: "featuredDesc",
      take: 100,
    }),
    countProperties({ status: "ACTIVE" }),
    distinctCities(),
  ]);
  return NextResponse.json({ properties, total, cities });
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

    const property = await createProperty({
      landlordId: user.id,
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
      images: (images as { url: string; isCover?: boolean }[]).map((img, idx) => ({
        url: img.url,
        isCover: idx === 0,
      })),
    });

    return NextResponse.json({ property }, { status: 201 });
  } catch (err) {
    console.error("create property", err);
    return NextResponse.json({ error: "Failed to create property" }, { status: 500 });
  }
}
