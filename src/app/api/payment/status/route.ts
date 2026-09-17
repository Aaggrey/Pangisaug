import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { checkGatewayPayment, type MoMoProvider } from "@/lib/payments";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const paymentId = url.searchParams.get("paymentId");
  if (!paymentId) return NextResponse.json({ error: "Missing payment id" }, { status: 400 });

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  if (user.role !== "ADMIN" && payment.landlordId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (payment.status === "SUCCESS") {
    return NextResponse.json({ status: "SUCCESS", payment });
  }
  if (payment.status === "FAILED") {
    return NextResponse.json({ status: "FAILED", payment });
  }

  if (!payment.gatewayRef) {
    return NextResponse.json({ status: "PENDING", payment });
  }

  try {
    const result = await checkGatewayPayment({
      provider: payment.method as MoMoProvider,
      gatewayRef: payment.gatewayRef,
      reference: payment.reference,
    });

    if (result.status === "SUCCESS") {
      const { finalizePayment } = await import("@/lib/payments/finalize");
      await finalizePayment(payment.id);
      const updated = await prisma.payment.findUnique({ where: { id: payment.id } });
      return NextResponse.json({ status: "SUCCESS", payment: updated });
    }

    if (result.status === "FAILED") {
      const { failPayment } = await import("@/lib/payments/finalize");
      await failPayment(payment.id, result.reason);
      const updated = await prisma.payment.findUnique({ where: { id: payment.id } });
      return NextResponse.json({ status: "FAILED", payment: updated, reason: result.reason });
    }

    return NextResponse.json({ status: "PENDING", payment });
  } catch {
    return NextResponse.json({ status: "PENDING", payment });
  }
}