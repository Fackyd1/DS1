import { readSession } from "@/lib/auth/session";
import { fail, ok } from "@/lib/api/http";
import { createRealmDepositIntent } from "@/services/realm-backend-service";

type DepositBody = {
  amount?: number;
  paymentMethod?: string;
  playerTag?: string;
};

const RECEIVER_WALLET = "HnG8ybQeEsN8swuRA44LDg19CiMUV24EDXJdbxVtSZSB";
const USDT_SOLANA_MINT = process.env.NEXT_PUBLIC_SOLANA_USDT_MINT || "Es9vMFrzaCERmJfrF4H2FYD4KCoNkW8f2s9u6D4M7wNY";
const DEPOSIT_PROVIDER = process.env.DEPOSIT_PROVIDER || "TRANSAK";

function fillTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => values[key] ?? "");
}

function resolveCheckoutUrl(params: {
  amount: number;
  intentId: string;
  playerTag: string;
  receiverWallet: string;
  asset: string;
  network: string;
}): string {
  const template =
    process.env.DEPOSIT_PROVIDER_URL_TEMPLATE ||
    "https://global.transak.com/?productsAvailed=BUY&defaultCryptoCurrency={asset}&defaultNetwork={network}&walletAddress={wallet}&fiatCurrency=USD&fiatAmount={amount}&partnerOrderId={intentId}&partnerCustomerId={playerTag}";

  return fillTemplate(template, {
    amount: params.amount.toFixed(2),
    wallet: encodeURIComponent(params.receiverWallet),
    asset: encodeURIComponent(params.asset),
    network: encodeURIComponent(params.network),
    intentId: encodeURIComponent(params.intentId),
    playerTag: encodeURIComponent(params.playerTag),
  });
}

export async function POST(request: Request) {
  const session = await readSession();

  const body = (await request.json()) as DepositBody;
  const amount = Number(body.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return fail("amount must be a positive number", 400);
  }

  const paymentMethod = body.paymentMethod?.trim() || "Card (Credit/Debit)";
  const requestPlayerTag = body.playerTag?.trim();
  const playerTag = session?.playerTag || requestPlayerTag || `public-${Date.now()}`;

  const depositIntent = await createRealmDepositIntent(playerTag, {
    amount,
    paymentMethod,
    network: "SOLANA",
    asset: "USDT",
    receiverWallet: RECEIVER_WALLET,
    playerTag,
    provider: DEPOSIT_PROVIDER,
  });

  const encodedLabel = encodeURIComponent("DS1 Blockchain Gate");
  const encodedMessage = encodeURIComponent(`USDT deposit for ${playerTag}`);
  const encodedMemo = encodeURIComponent(depositIntent.intentId);
  const solanaPayUrl = `solana:${RECEIVER_WALLET}?amount=${amount.toFixed(2)}&spl-token=${USDT_SOLANA_MINT}&label=${encodedLabel}&message=${encodedMessage}&memo=${encodedMemo}`;
  const externalCheckoutUrl = resolveCheckoutUrl({
    amount,
    intentId: depositIntent.intentId,
    playerTag,
    receiverWallet: RECEIVER_WALLET,
    asset: "USDT",
    network: "solana",
  });

  return ok({
    message: "Deposit intent created. Continue in external checkout and wait for verification callback.",
    intentId: depositIntent.intentId,
    provider: DEPOSIT_PROVIDER,
    playerTag,
    amount,
    paymentMethod,
    asset: "USDT",
    network: "SOLANA",
    receiverWallet: RECEIVER_WALLET,
    solanaPayUrl,
    externalCheckoutUrl,
  });
}
