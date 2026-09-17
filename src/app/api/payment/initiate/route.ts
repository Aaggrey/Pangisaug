import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { LISTING_FEE } from "@/lib/types";
import {
  initiateGatewayPayment,
  isValidUgPhone,
  normalizeUgPhone,
  type MoMoProvider,
} from "@/lib/payments";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "LANDLORD") {
    return NextResponse.json({ error: "Only landlords can pay listing fees" }, { status: 403 });
  }

  const { propertyId, method, phone } = await req.json().catch(() => ({}));
  if (!propertyId) return NextResponse.json({ error: "Missing property id" }, { status: 400 });

  if (!["MTN_MOMO", "AIRTEL_MOMO"].includes(method as string)) {
    return NextResponse.json({ error: "Choose MTN Mobile Money or Airtel Money" }, { status: 400 });
  }
  if (!phone || !isValidUgPhone(String(phone))) {
    return NextResponse.json({ error: "Enter a valid Ugandan mobile money number (e.g. 0701234567)" }, { status: 400 });
  }

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
  if (property.landlordId !== user.id) {
    return NextResponse.json({ error: "This is not your property" }, { status: 403 });
  }
  if (property.status !== "PENDING_PAYMENT") {
    return NextResponse.json({ error: "This property is already paid and live" }, { status: 400 });
  }

  const existingPending = await prisma.payment.findFirst({
    where: { propertyId, status: "PENDING" },
  });
  if (existingPending) {
    return NextResponse.json({
      error: "A pending payment already exists for this property",
      payment: {
        id: existingPending.id,
        reference: existingPending.reference,
        method: existingPending.method,
        status: existingPending.status,
      },
    });
  }

  const reference = `PANG-${randomUUID().slice(0, 8).toUpperCase()}`;
  const momoNumber = normalizeUgPhone(String(phone));

  const payment = await prisma.payment.create({
    data: {
      landlordId: user.id,
      propertyId: property.id,
      amount: LISTING_FEE,
      reference,
      method: method as MoMoProvider,
      phone: momoNumber,
      status: "PENDING",
    },
  });

  try {
    const initiated = await initiateGatewayPayment({
      provider: method as MoMoProvider,
      phone: momoNumber,
      amount: LISTING_FEE,
      reference: payment.reference,
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { gatewayRef: initiated.gatewayRef },
    });

    if (initiated.gatewayStatus === "SUCCESS") {
      const { finalizePayment } = await import("@/lib/payments/finalize");
      await finalizePayment(payment.id);
    }

    return NextResponse.json({
      payment: {
        id: payment.id,
        reference: payment.reference,
        method: payment.method,
        phone: momoNumber,
        status: "PENDING",
      },
      gatewayStatus: initiated.gatewayStatus,
    });
  } catch (e) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to start payment" },
      { status: 502 }
    );
  }
}