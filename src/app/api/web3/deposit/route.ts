import { readSession } from "@/lib/auth/session";
import { fail, ok } from "@/lib/api/http";
import { createRealmDepositIntent } from "@/services/realm-backend-service";

type DepositBody = {
  amount?: number;
  paymentMethod?: string;
  playerTag?: string;
  checkoutProvider?: string;
};

const RECEIVER_WALLET = "HnG8ybQeEsN8swuRA44LDg19CiMUV24EDXJdbxVtSZSB";
const USDT_SOLANA_MINT = process.env.NEXT_PUBLIC_SOLANA_USDT_MINT || "Es9vMFrzaCERmJfrF4H2FYD4KCoNkW8f2s9u6D4M7wNY";
const DEFAULT_DEPOSIT_PROVIDER = process.env.DEPOSIT_PROVIDER || "MOONPAY";

type CheckoutProvider = "MOONPAY" | "TRANSAK" | "ONRAMPER";

const SUPPORTED_CHECKOUT_PROVIDERS: CheckoutProvider[] = ["MOONPAY", "TRANSAK", "ONRAMPER"];

function normalizeCheckoutProvider(value?: string): CheckoutProvider {
  const upper = (value || "").toUpperCase() as CheckoutProvider;
  if (SUPPORTED_CHECKOUT_PROVIDERS.includes(upper)) {
    return upper;
  }

  const envDefault = (DEFAULT_DEPOSIT_PROVIDER || "").toUpperCase() as CheckoutProvider;
  if (SUPPORTED_CHECKOUT_PROVIDERS.includes(envDefault)) {
    return envDefault;
  }

  return "MOONPAY";
}

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
  provider: CheckoutProvider;
}): string {
  if (process.env.DEPOSIT_PROVIDER_URL_TEMPLATE) {
    return fillTemplate(process.env.DEPOSIT_PROVIDER_URL_TEMPLATE, {
      amount: params.amount.toFixed(2),
      wallet: encodeURIComponent(params.receiverWallet),
      asset: encodeURIComponent(params.asset),
      network: encodeURIComponent(params.network),
      intentId: encodeURIComponent(params.intentId),
      playerTag: encodeURIComponent(params.playerTag),
    });
  }

  if (params.provider === "TRANSAK") {
    return fillTemplate(
      "https://global.transak.com/?productsAvailed=BUY&defaultCryptoCurrency={asset}&defaultNetwork={network}&walletAddress={wallet}&fiatCurrency=USD&fiatAmount={amount}&partnerOrderId={intentId}&partnerCustomerId={playerTag}",
      {
        amount: params.amount.toFixed(2),
        wallet: encodeURIComponent(params.receiverWallet),
        asset: encodeURIComponent(params.asset),
        network: encodeURIComponent(params.network),
        intentId: encodeURIComponent(params.intentId),
        playerTag: encodeURIComponent(params.playerTag),
      }
    );
  }

  if (params.provider === "ONRAMPER") {
    return fillTemplate(
      "https://buy.onramper.com/?defaultCrypto={asset}&defaultAmount={amount}&defaultFiat=USD&wallets=solana:{wallet}&trackingId={intentId}&customerId={playerTag}",
      {
        amount: params.amount.toFixed(2),
        wallet: encodeURIComponent(params.receiverWallet),
        asset: encodeURIComponent(params.asset),
        network: encodeURIComponent(params.network),
        intentId: encodeURIComponent(params.intentId),
        playerTag: encodeURIComponent(params.playerTag),
      }
    );
  }

  return fillTemplate(
    "https://buy.moonpay.com/?currencyCode={asset}&baseCurrencyCode=usd&baseCurrencyAmount={amount}&walletAddress={wallet}&networkCode=solana&externalTransactionId={intentId}&externalCustomerId={playerTag}",
    {
      amount: params.amount.toFixed(2),
      wallet: encodeURIComponent(params.receiverWallet),
      asset: encodeURIComponent(params.asset.toLowerCase()),
      network: encodeURIComponent(params.network),
      intentId: encodeURIComponent(params.intentId),
      playerTag: encodeURIComponent(params.playerTag),
    }
  );
}

function providerFallbackOrder(selected: CheckoutProvider): CheckoutProvider[] {
  return [selected, ...SUPPORTED_CHECKOUT_PROVIDERS.filter((provider) => provider !== selected)];
}

function buildCheckoutCandidates(params: {
  selectedProvider: CheckoutProvider;
  amount: number;
  intentId: string;
  playerTag: string;
  receiverWallet: string;
  asset: string;
  network: string;
}) {
  const order = providerFallbackOrder(params.selectedProvider);

  return order.map((provider) => ({
    provider,
    url: resolveCheckoutUrl({
      amount: params.amount,
      intentId: params.intentId,
      playerTag: params.playerTag,
      receiverWallet: params.receiverWallet,
      asset: params.asset,
      network: params.network,
      provider,
    }),
  }));
}

function providerLabel(provider: CheckoutProvider): string {
  if (provider === "TRANSAK") {
    return "Transak";
  }

  if (provider === "ONRAMPER") {
    return "Onramper";
  }

  return "MoonPay";
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
  const selectedProvider = normalizeCheckoutProvider(body.checkoutProvider);

  const depositIntent = await createRealmDepositIntent(playerTag, {
    amount,
    paymentMethod,
    network: "SOLANA",
    asset: "USDT",
    receiverWallet: RECEIVER_WALLET,
    playerTag,
    provider: providerLabel(selectedProvider),
  });

  const encodedLabel = encodeURIComponent("DS1 Blockchain Gate");
  const encodedMessage = encodeURIComponent(`USDT deposit for ${playerTag}`);
  const encodedMemo = encodeURIComponent(depositIntent.intentId);
  const solanaPayUrl = `solana:${RECEIVER_WALLET}?amount=${amount.toFixed(2)}&spl-token=${USDT_SOLANA_MINT}&label=${encodedLabel}&message=${encodedMessage}&memo=${encodedMemo}`;
  const checkoutCandidates = buildCheckoutCandidates({
    selectedProvider,
    amount,
    intentId: depositIntent.intentId,
    playerTag,
    receiverWallet: RECEIVER_WALLET,
    asset: "USDT",
    network: "solana",
  });
  const externalCheckoutUrl = checkoutCandidates[0]?.url;

  return ok({
    message: "Deposit intent created. If a provider is blocked, use another provider option.",
    intentId: depositIntent.intentId,
    provider: selectedProvider,
    playerTag,
    amount,
    paymentMethod,
    asset: "USDT",
    network: "SOLANA",
    receiverWallet: RECEIVER_WALLET,
    solanaPayUrl,
    externalCheckoutUrl,
    checkoutCandidates,
  });
}
