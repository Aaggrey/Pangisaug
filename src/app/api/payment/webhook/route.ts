import { NextResponse } from "next/server";
import { findPaymentByReference, updatePayment } from "@/lib/db";
import { checkGatewayPayment, type MoMoProvider } from "@/lib/payments";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const method = (body.method ?? body.provider ?? "") as MoMoProvider;
  const reference = (body.reference ?? body.externalId ?? "") as string;
  const gatewayRef = (body.gatewayRef ?? body.transactionRef ?? body.txnId ?? "") as string;

  if (!["MTN_MOMO", "AIRTEL_MOMO"].includes(method) || !reference) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const payment = await findPaymentByReference(reference);
  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  if (payment.status !== "PENDING") {
    return NextResponse.json({ ok: true, status: payment.status });
  }

  const ref = gatewayRef || payment.gatewayRef;
  if (!ref) {
    return NextResponse.json({ error: "No gateway reference" }, { status: 400 });
  }

  try {
    const result = await checkGatewayPayment({ provider: method, gatewayRef: ref, reference });

    if (result.status === "SUCCESS") {
      const { finalizePayment } = await import("@/lib/payments/finalize");
      if (gatewayRef && gatewayRef !== payment.gatewayRef) {
        await updatePayment(payment.id, { gatewayRef });
      }
      await finalizePayment(payment.id);
      return NextResponse.json({ ok: true, status: "SUCCESS" });
    }

    if (result.status === "FAILED") {
      const { failPayment } = await import("@/lib/payments/finalize");
      await failPayment(payment.id, result.reason);
      return NextResponse.json({ ok: true, status: "FAILED" });
    }

    return NextResponse.json({ ok: true, status: "PENDING" });
  } catch {
    return NextResponse.json({ error: "Gateway check failed" }, { status: 502 });
  }
}