import { NextResponse } from "next/server";
import { findProperties, countProperties } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN" && user.role !== "LANDLORD") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const landlordId = user.role === "ADMIN" ? undefined : user.id;

  const [properties, total] = await Promise.all([
    findProperties({
      landlordId,
      includeImages: true,
      orderBy: "createdAtDesc",
      take: 100,
    }),
    countProperties({ landlordId }),
  ]);

  return NextResponse.json({ properties, total });
}