"use client";

import { BrowserProvider } from "ethers";
import { useState } from "react";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

type WalletState = {
  address: string;
  chainId: string;
};

export function WalletPanel() {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [status, setStatus] = useState("Wallet disconnected");

  async function connectWallet() {
    try {
      if (!("ethereum" in window)) {
        setStatus("No wallet provider detected.");
        return;
      }

      const provider = new BrowserProvider(
        (window as Window & { ethereum?: EthereumProvider }).ethereum as EthereumProvider
      );
      const accounts = await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();
      const account = accounts[0] as string | undefined;

      if (!account) {
        setStatus("No account selected.");
        return;
      }

      setWallet({
        address: account,
        chainId: network.chainId.toString(),
      });
      setStatus("Wallet connected.");
    } catch {
      setStatus("Unable to connect wallet.");
    }
  }

  function disconnectWallet() {
    setWallet(null);
    setStatus("Wallet disconnected");
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-xl text-[var(--color-text)]">Blockchain Gate</h3>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">Optional wallet mode on testnet. No private keys stored.</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={connectWallet}
          className="rounded-full border border-[var(--color-web3)]/60 px-4 py-2 text-sm"
        >
          CONNECT WALLET
        </button>
        <button type="button" onClick={disconnectWallet} className="rounded-full border border-white/20 px-4 py-2 text-sm">
          DISCONNECT
        </button>
      </div>

      <p className="mt-4 text-sm text-[var(--color-text-muted)]">{status}</p>

      {wallet ? (
        <div className="mt-4 text-sm text-[var(--color-text-soft)]">
          <p>Address: {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</p>
          <p>Chain: {wallet.chainId}</p>
        </div>
      ) : null}
    </section>
  );
}
