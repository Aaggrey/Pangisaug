import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import type { BookingStatus } from "@prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user || user.role === "USER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { status } = await req.json();
  if (!["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const booking = await prisma.visitBooking.findUnique({
    where: { id },
    include: { property: { select: { landlordId: true } } },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isLandlordOwner = booking.property.landlordId === user.id;
  const isAdmin = user.role === "ADMIN";
  if (!isLandlordOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.visitBooking.update({
    where: { id },
    data: { status: status as BookingStatus },
  });

  return NextResponse.json({ booking: updated });
}