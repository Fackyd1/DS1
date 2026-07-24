"use client";

import { useState } from "react";

export function WalletPanel() {
  const [status, setStatus] = useState("Ready for external deposits.");
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Card (Credit/Debit)");
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);

  const binanceSolanaWallet = "HnG8ybQeEsN8swuRA44LDg19CiMUV24EDXJdbxVtSZSB";

  async function copyWalletAddress() {
    try {
      await navigator.clipboard.writeText(binanceSolanaWallet);
      setStatus("Binance wallet address copied.");
    } catch {
      setStatus("Unable to copy wallet address.");
    }
  }

  function openDepositWindow() {
    setIsDepositOpen(true);
    setStatus("Deposit window opened.");
  }

  function closeDepositWindow() {
    setIsDepositOpen(false);
  }

  async function submitDepositRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedAmount = Number.parseFloat(depositAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setStatus("Enter a valid amount to deposit.");
      return;
    }

    setIsSubmittingDeposit(true);
    try {
      const response = await fetch("/api/web3/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsedAmount, paymentMethod }),
      });

      const body = (await response.json()) as {
        message?: string;
        solanaPayUrl?: string;
        externalCheckoutUrl?: string;
      };
      if (!response.ok) {
        setStatus(body.message || "Unable to create deposit intent.");
        return;
      }

      const checkoutUrl = paymentMethod === "Card (Credit/Debit)" ? body.externalCheckoutUrl : body.solanaPayUrl;
      if (checkoutUrl) {
        window.open(checkoutUrl, "_blank", "noopener,noreferrer");
      }

      setStatus(body.message || `Deposit started: ${parsedAmount.toFixed(2)} USDT on Solana.`);
    } catch {
      setStatus("Unable to start deposit.");
    } finally {
      setIsSubmittingDeposit(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-xl text-[var(--color-text)]">Blockchain Gate</h3>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">External payment flow to fund your USDT wallet on Solana.</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={openDepositWindow}
          className="rounded-full border border-[var(--color-web3)]/60 px-4 py-2 text-sm"
        >
          OPEN PAYMENT FORM
        </button>
      </div>

      <p className="mt-4 text-sm text-[var(--color-text-muted)]">{status}</p>

      {isDepositOpen ? (
        <div className="mt-5 rounded-2xl border border-[var(--color-web3)]/40 bg-black/20 p-4">
          <div className="flex items-start justify-between gap-3">
            <h4 className="text-base text-[var(--color-text)]">THE BLOCKCHAIN GATE</h4>
            <button
              type="button"
              onClick={closeDepositWindow}
              className="rounded-full border border-white/20 px-3 py-1 text-xs"
            >
              CLOSE
            </button>
          </div>

          <form className="mt-4 space-y-3" onSubmit={submitDepositRequest}>
            <label className="block text-sm text-[var(--color-text-soft)]" htmlFor="deposit-amount">
              Amount (USDT)
            </label>
            <input
              id="deposit-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={depositAmount}
              onChange={(event) => setDepositAmount(event.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-web3)]/70"
              required
            />

            <label className="block text-sm text-[var(--color-text-soft)]" htmlFor="payment-method">
              Payment Method
            </label>
            <select
              id="payment-method"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-web3)]/70"
            >
              <option>Card (Credit/Debit)</option>
              <option>USDT (Solana Wallet)</option>
            </select>

            <div className="rounded-xl border border-white/15 bg-black/20 p-3 text-sm text-[var(--color-text-soft)]">
              <p>Asset: USDT</p>
              <p>Network: Solana (SOL)</p>
              <p>Deposit type: External checkout</p>
              <p className="mt-2 break-all">Wallet: {binanceSolanaWallet}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={isSubmittingDeposit}
                className="rounded-full border border-[var(--color-web3)]/60 px-4 py-2 text-sm text-[var(--color-text)]"
              >
                {isSubmittingDeposit ? "OPENING CHECKOUT..." : "MAKE DEPOSIT"}
              </button>
              <button
                type="button"
                onClick={copyWalletAddress}
                className="rounded-full border border-white/20 px-4 py-2 text-sm"
              >
                COPY WALLET
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
