import { prisma } from "@/lib/prisma";

export async function finalizePayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });
  if (!payment) throw new Error("Payment not found");

  if (payment.status !== "SUCCESS") {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: paymentId },
        data: { status: "SUCCESS", paidAt: new Date() },
      }),
      prisma.property.update({
        where: { id: payment.propertyId },
        data: { status: "ACTIVE" },
      }),
    ]);
  }

  const updated = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { property: { select: { id: true } } },
  });
  return updated;
}

export async function failPayment(paymentId: string, reason?: string) {
  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: "FAILED" },
  });
  void reason;
}