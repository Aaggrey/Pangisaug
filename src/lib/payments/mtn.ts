const BASE_URL = process.env.MTN_MOMO_BASE_URL ?? "https://sandbox.momodeveloper.mtn.com";
const TARGET_ENV = process.env.MTN_MOMO_TARGET_ENV ?? "sandbox";
const API_USER = process.env.MTN_MOMO_API_USER ?? "";
const API_KEY = process.env.MTN_MOMO_API_KEY ?? "";
const SUBSCRIPTION_KEY = process.env.MTN_MOMO_SUBSCRIPTION_KEY ?? "";

export interface MomoRequestToPayInput {
  amount: number;
  currency: string;
  externalId: string;
  phone: string;
  payerMessage?: string;
  payeeNote?: string;
}

export interface MomoTransactionStatus {
  status: "PENDING" | "SUCCESSFUL" | "FAILED" | "REJECTED" | string;
  reason?: string;
  externalId?: string;
  financialTransactionId?: string;
}

function requireConfig() {
  if (!API_USER || !API_KEY || !SUBSCRIPTION_KEY || !TARGET_ENV) {
    throw new Error(
      "MTN MoMo is not configured. Set MTN_MOMO_API_USER, MTN_MOMO_API_KEY, MTN_MOMO_SUBSCRIPTION_KEY and MTN_MOMO_TARGET_ENV in .env"
    );
  }
}

async function getAccessToken() {
  const credentials = Buffer.from(`${API_USER}:${API_KEY}`).toString("base64");
  const res = await fetch(`${BASE_URL}/collection/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ grant_type: "client_credentials" }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MTN token request failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function mtnRequestToPay(input: MomoRequestToPayInput): Promise<{ referenceId: string }> {
  requireConfig();
  const token = await getAccessToken();
  const referenceId = crypto.randomUUID();

  const res = await fetch(`${BASE_URL}/collection/v1_0/requesttopay`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Reference-Id": referenceId,
      "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
      "X-Target-Environment": TARGET_ENV,
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
    body: JSON.stringify({
      amount: String(input.amount),
      currency: input.currency,
      externalId: input.externalId,
      payer: { partyIdType: "MSISDN", partyId: input.phone },
      payerMessage: input.payerMessage ?? "Pangisaug listing fee",
      payeeNote: input.payeeNote ?? "Listing fee payment for Pangisaug",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MTN request to pay failed (${res.status}): ${text}`);
  }

  return { referenceId };
}

export async function mtnGetTransactionStatus(referenceId: string): Promise<MomoTransactionStatus> {
  requireConfig();
  const token = await getAccessToken();

  const res = await fetch(`${BASE_URL}/collection/v1_0/requesttopay/${referenceId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
      "X-Target-Environment": TARGET_ENV,
    },
  });

  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`MTN status request failed (${res.status}): ${text}`);
  }
  if (res.status === 404) {
    return { status: "PENDING" };
  }

  const data = (await res.json()) as {
    status?: string;
    reason?: string;
    externalId?: string;
    financialTransactionId?: string;
  };
  return {
    status: data.status ?? "PENDING",
    reason: data.reason,
    externalId: data.externalId,
    financialTransactionId: data.financialTransactionId,
  };
}