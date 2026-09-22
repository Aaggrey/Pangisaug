import { findPaymentById, updatePayment, updateProperty, withTransaction } from "@/lib/db";

export async function finalizePayment(paymentId: string) {
  const payment = await findPaymentById(paymentId);
  if (!payment) throw new Error("Payment not found");

  if (payment.status !== "SUCCESS") {
    await withTransaction(async (q) => {
      await q.run(`UPDATE "Payment" SET status = 'SUCCESS', "paidAt" = now() WHERE id = $1`, [paymentId]);
      await q.run(`UPDATE "Property" SET status = 'ACTIVE', "updatedAt" = now() WHERE id = $1`, [payment.propertyId]);
    });
  }

  return findPaymentById(paymentId);
}

export async function failPayment(paymentId: string, reason?: string) {
  await updatePayment(paymentId, { status: "FAILED" });
  void reason;
}