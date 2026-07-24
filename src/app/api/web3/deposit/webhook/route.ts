import { createHmac, timingSafeEqual } from "node:crypto";
import { fail, ok } from "@/lib/api/http";
import { markRealmDepositVerified } from "@/services/realm-backend-service";

function extractString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

function verifyPlainSignature(signature: string, secret: string): boolean {
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(secret));
  } catch {
    return false;
  }
}

function normalizeStatus(status?: string): string {
  const value = (status || "").toUpperCase();
  if (["COMPLETED", "SUCCESS", "CONFIRMED", "PAID"].includes(value)) {
    return "CONFIRMED";
  }
  if (["DENIED", "DECLINED", "REJECTED", "REFUSED"].includes(value)) {
    return "DENIED";
  }
  if (["FAILED", "CANCELLED", "EXPIRED"].includes(value)) {
    return "FAILED";
  }
  return "PENDING";
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const secret = process.env.DEPOSIT_WEBHOOK_SECRET;
  const signatureMode = (process.env.DEPOSIT_WEBHOOK_SIGNATURE_MODE || "sha256-hex").toLowerCase();

  if (!secret) {
    return fail("DEPOSIT_WEBHOOK_SECRET is not configured", 503);
  }

  const signatureHeader =
    request.headers.get("x-deposit-signature") ||
    request.headers.get("x-transak-signature") ||
    request.headers.get("x-moonpay-signature") ||
    "";

  const isValidSignature =
    signatureMode === "plain"
      ? verifyPlainSignature(signatureHeader, secret)
      : verifySignature(rawBody, signatureHeader, secret);

  if (!signatureHeader || !isValidSignature) {
    return fail("Invalid webhook signature", 401);
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return fail("Invalid JSON payload", 400);
  }

  const intentId =
    extractString(payload.intentId) ||
    extractString(payload.partnerOrderId) ||
    extractString((payload.metadata as Record<string, unknown> | undefined)?.intentId) ||
    extractString(payload.memo);

  const playerTag =
    extractString(payload.playerTag) ||
    extractString(payload.partnerCustomerId) ||
    extractString((payload.metadata as Record<string, unknown> | undefined)?.playerTag);

  const status = normalizeStatus(extractString(payload.status));
  const transactionId = extractString(payload.transactionId) || extractString(payload.txHash);
  const provider = extractString(payload.provider) || process.env.DEPOSIT_PROVIDER || "THIRD_PARTY";

  if (!intentId || !playerTag) {
    return fail("intentId and playerTag are required in webhook payload", 400);
  }

  await markRealmDepositVerified(playerTag, {
    intentId,
    status,
    transactionId,
    provider,
    providerPayload: payload,
  });

  return ok({ ok: true, intentId, status });
}
