const BASE_URL = process.env.AIRTEL_BASE_URL ?? "https://openapiuat.airtel.africa";
const CLIENT_ID = process.env.AIRTEL_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.AIRTEL_CLIENT_SECRET ?? "";
const COUNTRY = process.env.AIRTEL_COUNTRY ?? "UG";
const CURRENCY = process.env.AIRTEL_CURRENCY ?? "UGX";

export interface AirtelInitiateInput {
  reference: string;
  phone: string;
  amount: number;
}

export interface AirtelTransactionStatus {
  status: "SUCCESS" | "PENDING" | "FAILED";
  rawStatus?: string;
  failureReason?: string;
  txnId?: string;
}

function requireConfig() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      "Airtel Money is not configured. Set AIRTEL_CLIENT_ID and AIRTEL_CLIENT_SECRET in .env"
    );
  }
}

async function getToken() {
  const res = await fetch(`${BASE_URL}/merchant/v1/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Airtel token request failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function airtelInitiatePayment(
  input: AirtelInitiateInput
): Promise<{ txnId: string; status: string }> {
  requireConfig();
  const token = await getToken();

  const res = await fetch(`${BASE_URL}/merchant/v1/payments/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Country": COUNTRY,
      "X-Currency": CURRENCY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reference: input.reference.slice(0, 20),
      subscriber: {
        country: COUNTRY,
        currency: CURRENCY,
        msisdn: input.phone,
      },
      transaction: {
        amount: input.amount,
        country: COUNTRY,
        currency: CURRENCY,
        id: input.reference.slice(0, 20),
        type: "CMI",
      },
    }),
  });

  const data = await res.json().catch(() => ({})) as {
    transaction_status?: string;
    txn_id?: string;
    message?: string;
  };
  if (!res.ok) {
    throw new Error(`Airtel initiate failed (${res.status}): ${JSON.stringify(data)}`);
  }
  if (data.transaction_status === "TF") {
    throw new Error(`Airtel rejected the request: ${data.message ?? "unknown reason"}`);
  }

  return { txnId: data.txn_id ?? input.reference, status: data.transaction_status ?? "TS" };
}

export async function airtelGetTransactionStatus(
  txnId: string,
  reference: string
): Promise<AirtelTransactionStatus> {
  requireConfig();
  const token = await getToken();

  const query = new URLSearchParams({
    reference: reference.slice(0, 20),
    country: COUNTRY,
    currency: CURRENCY,
  });
  const res = await fetch(`${BASE_URL}/merchant/v1/payments/${txnId}?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Country": COUNTRY,
      "X-Currency": CURRENCY,
      "Content-Type": "application/json",
    },
  });

  const data = (await res.json().catch(() => ({}))) as {
    transaction_status?: string;
    message?: string;
    txn_id?: string;
  };
  if (!res.ok) {
    return { status: "PENDING", rawStatus: "UNKNOWN", txnId };
  }

  const raw = data.transaction_status ?? "TI";
  // TP = transaction paid/successful, TS = submitted, TI = in progress, TF = failed
  const status = raw === "TP" ? "SUCCESS" : raw === "TF" ? "FAILED" : "PENDING";
  return { status, rawStatus: raw, failureReason: data.message, txnId: data.txn_id ?? txnId };
}