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

  const payments = await prisma.payment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      property: { select: { id: true, title: true } },
      landlord: { select: { id: true, name: true, email: true } },
    },
    take: 100,
  });

  return NextResponse.json({ payments });
}