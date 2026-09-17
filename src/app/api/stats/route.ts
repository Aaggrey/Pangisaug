import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const base = user.role === "ADMIN" ? {} : { landlordId: user.id };

  const [properties, bookings, payments, totalRevenue] = await Promise.all([
    prisma.property.count({ where: user.role === "ADMIN" ? {} : base }),
    prisma.visitBooking.count({
      where: user.role === "ADMIN" ? {} : user.role === "USER" ? { userId: user.id } : { property: { landlordId: user.id } },
    }),
    prisma.payment.count({ where: user.role === "ADMIN" ? {} : base }),
    prisma.payment.aggregate({ where: user.role === "ADMIN" ? {} : base, _sum: { amount: true } }),
  ]);

  return NextResponse.json({
    userRole: user.role,
    properties,
    bookings,
    payments,
    totalRevenue: totalRevenue._sum.amount ?? 0,
  });
}