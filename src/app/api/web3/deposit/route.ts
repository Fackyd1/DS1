import { readSession } from "@/lib/auth/session";
import { fail, ok } from "@/lib/api/http";
import { createRealmDepositIntent } from "@/services/realm-backend-service";

type DepositBody = {
  amount?: number;
  paymentMethod?: string;
};

const RECEIVER_WALLET = "HnG8ybQeEsN8swuRA44LDg19CiMUV24EDXJdbxVtSZSB";
const USDT_SOLANA_MINT = process.env.NEXT_PUBLIC_SOLANA_USDT_MINT || "Es9vMFrzaCERmJfrF4H2FYD4KCoNkW8f2s9u6D4M7wNY";

export async function POST(request: Request) {
  const session = await readSession();
  if (!session) {
    return fail("Unauthorized", 401);
  }

  const body = (await request.json()) as DepositBody;
  const amount = Number(body.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return fail("amount must be a positive number", 400);
  }

  const paymentMethod = body.paymentMethod?.trim() || "USDT (Solana)";

  const encodedLabel = encodeURIComponent("DS1 Blockchain Gate");
  const encodedMessage = encodeURIComponent(`USDT deposit for ${session.playerTag}`);
  const encodedMemo = encodeURIComponent(`DS1-${session.playerTag}-${Date.now()}`);
  const solanaPayUrl = `solana:${RECEIVER_WALLET}?amount=${amount.toFixed(2)}&spl-token=${USDT_SOLANA_MINT}&label=${encodedLabel}&message=${encodedMessage}&memo=${encodedMemo}`;
  const externalCheckoutUrl =
    `https://www.moonpay.com/buy/usdt` +
    `?baseCurrencyAmount=${amount.toFixed(2)}` +
    `&currencyCode=usd` +
    `&walletAddress=${encodeURIComponent(RECEIVER_WALLET)}` +
    `&network=solana`;

  await createRealmDepositIntent(session.playerTag, {
    amount,
    paymentMethod,
    network: "SOLANA",
    asset: "USDT",
    receiverWallet: RECEIVER_WALLET,
    playerTag: session.playerTag,
  });

  return ok({
    message: "Deposit intent created. Continue in external checkout to complete transfer.",
    amount,
    paymentMethod,
    asset: "USDT",
    network: "SOLANA",
    receiverWallet: RECEIVER_WALLET,
    solanaPayUrl,
    externalCheckoutUrl,
  });
}
