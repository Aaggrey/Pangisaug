import { NextResponse } from "next/server";
import { findVisitBookingById, updateVisitBooking, findPropertyById } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

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

  const booking = await findVisitBookingById(id);
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const property = await findPropertyById(booking.propertyId);
  const isLandlordOwner = property?.landlordId === user.id;
  const isAdmin = user.role === "ADMIN";
  if (!isLandlordOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await updateVisitBooking(id, { status: status as BookingStatus });
  return NextResponse.json({ booking: updated });
}