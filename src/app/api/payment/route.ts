import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  findPropertyById,
  createPayment,
  updatePayment,
  updateProperty,
} from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { LISTING_FEE } from "@/lib/types";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "LANDLORD") {
    return NextResponse.json({ error: "Only landlords can pay listing fees" }, { status: 403 });
  }

  const { propertyId, method } = await req.json().catch(() => ({}));
  if (!propertyId) return NextResponse.json({ error: "Missing property id" }, { status: 400 });

  const property = await findPropertyById(propertyId);
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
  if (property.landlordId !== user.id) {
    return NextResponse.json({ error: "This is not your property" }, { status: 403 });
  }

  if (property.status !== "PENDING_PAYMENT") {
    return NextResponse.json({ error: "This property is already paid and live" }, { status: 400 });
  }

  const reference = `PANG-${randomUUID().slice(0, 8).toUpperCase()}`;

  const payment = await createPayment({
    landlordId: user.id,
    propertyId: property.id,
    amount: LISTING_FEE,
    reference,
    method: method || "GCASH",
    status: "SUCCESS",
  });
  await updatePayment(payment.id, { status: "SUCCESS", paidAt: new Date() });
  await updateProperty(property.id, { status: "ACTIVE" });

  return NextResponse.json({
    payment: { id: payment.id, reference: payment.reference, amount: payment.amount, method: payment.method },
  });
}