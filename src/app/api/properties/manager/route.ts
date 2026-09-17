import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN" && user.role !== "LANDLORD") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const where = user.role === "ADMIN" ? {} : { landlordId: user.id };

  const properties = await prisma.property.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { images: { orderBy: { isCover: "desc" } } },
  });

  return NextResponse.json({ properties });
}