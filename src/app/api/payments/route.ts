import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { listPayments, findPropertyById, findUserById } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN" && user.role !== "LANDLORD") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await listPayments({
    landlordId: user.role === "ADMIN" ? undefined : user.id,
    limit: 100,
  });

  const payments = await Promise.all(
    rows.map(async (p) => {
      const property = await findPropertyById(p.propertyId);
      const landlord = await findUserById(p.landlordId);
      return {
        id: p.id,
        landlordId: p.landlordId,
        propertyId: p.propertyId,
        amount: p.amount,
        reference: p.reference,
        gatewayRef: p.gatewayRef,
        method: p.method,
        status: p.status,
        createdAt: p.createdAt,
        paidAt: p.paidAt,
        property: {
          id: p.propertyId,
          title: property?.title ?? null,
          price: property?.price ?? null,
          city: property?.city ?? null,
          address: property?.address ?? null,
        },
        landlord: {
          id: p.landlordId,
          name: landlord?.name ?? "",
          email: landlord?.email ?? "",
        },
      };
    })
  );

  return NextResponse.json({ payments });
}