export function normalizeUgPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "256" + digits.slice(1);
  else if (digits.startsWith("256")) {
    // already national format
  } else if (digits.startsWith("+")) {
    digits = digits.slice(1);
  } else if (digits.length === 9) {
    digits = "256" + digits;
  }
  return digits;
}

export function isValidUgPhone(raw: string): boolean {
  const digits = normalizeUgPhone(raw);
  return /^2567\d{8}$/.test(digits) || /^256\d{9}$/.test(digits);
}

export type MoMoProvider = "MTN_MOMO" | "AIRTEL_MOMO";

export const MOMO_PROVIDERS: MoMoProvider[] = ["MTN_MOMO", "AIRTEL_MOMO"];

export interface InitiateResult {
  gatewayRef: string;
  gatewayStatus: "SUCCESS" | "PENDING";
  rawStatus?: string;
}

export async function initiateGatewayPayment(opts: {
  provider: MoMoProvider;
  phone: string;
  amount: number;
  reference: string;
}): Promise<InitiateResult> {
  if (opts.provider === "MTN_MOMO") {
    const { mtnRequestToPay } = await import("./mtn");
    const { referenceId } = await mtnRequestToPay({
      amount: opts.amount,
      currency: "UGX",
      externalId: opts.reference,
      phone: opts.phone,
    });
    return { gatewayRef: referenceId, gatewayStatus: "PENDING" };
  }

  const { airtelInitiatePayment } = await import("./airtel");
  const initiated = await airtelInitiatePayment({
    reference: opts.reference,
    phone: opts.phone,
    amount: opts.amount,
  });
  return {
    gatewayRef: initiated.txnId,
    gatewayStatus: initiated.status === "TS" ? "PENDING" : initiated.status === "TP" ? "SUCCESS" : "PENDING",
    rawStatus: initiated.status,
  };
}

export async function checkGatewayPayment(opts: {
  provider: MoMoProvider;
  gatewayRef: string;
  reference: string;
}): Promise<{ status: "SUCCESS" | "FAILED" | "PENDING"; rawStatus?: string; reason?: string }> {
  if (opts.provider === "MTN_MOMO") {
    const { mtnGetTransactionStatus } = await import("./mtn");
    const s = await mtnGetTransactionStatus(opts.gatewayRef);
    if (s.status === "SUCCESSFUL") return { status: "SUCCESS", rawStatus: s.status };
    if (s.status === "FAILED" || s.status === "REJECTED")
      return { status: "FAILED", rawStatus: s.status, reason: s.reason };
    return { status: "PENDING", rawStatus: s.status };
  }

  const { airtelGetTransactionStatus } = await import("./airtel");
  const s = await airtelGetTransactionStatus(opts.gatewayRef, opts.reference);
  return { status: s.status, rawStatus: s.rawStatus, reason: s.failureReason };
}

export const MOMO_METHODS_LABEL: Record<MoMoProvider, string> = {
  MTN_MOMO: "MTN Mobile Money",
  AIRTEL_MOMO: "Airtel Money",
};

export const PROVIDER_COLORS: Record<MoMoProvider, string> = {
  MTN_MOMO: "bg-yellow-400 text-black",
  AIRTEL_MOMO: "bg-red-500 text-white",
};