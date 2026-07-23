"use client";

import { FormEvent, useState } from "react";

type SessionData = {
  userId?: string;
  playerTag: string;
  role: string;
  mode: string;
};

export function AuthTerminal() {
  const [status, setStatus] = useState("Not authenticated.");
  const [session, setSession] = useState<SessionData | null>(null);

  async function refreshSession() {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    const body = (await response.json()) as { session: SessionData | null };
    setSession(body.session);
    setStatus(body.session ? `Signed as ${body.session.playerTag} (${body.session.mode}).` : "No active session.");
  }

  async function guestMode() {
    const response = await fetch("/api/auth/guest", { method: "POST" });
    if (!response.ok) {
      setStatus("Unable to create guest session.");
      return;
    }
    await refreshSession();
  }

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: String(form.get("registerEmail") || ""),
        username: String(form.get("registerUsername") || ""),
        displayName: String(form.get("registerDisplayName") || ""),
        password: String(form.get("registerPassword") || ""),
      }),
    });

    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setStatus(body.message || "Register failed.");
      return;
    }

    setStatus("Account created.");
    await refreshSession();
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: String(form.get("loginEmail") || ""),
        password: String(form.get("loginPassword") || ""),
      }),
    });

    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setStatus(body.message || "Login failed.");
      return;
    }

    setStatus("Account session started.");
    await refreshSession();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession(null);
    setStatus("Signed out.");
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-xl text-[var(--color-text)]">Authentication Terminal</h3>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">Guest mode and account mode are both supported.</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button onClick={guestMode} className="rounded-full border border-white/20 px-4 py-2 text-sm" type="button">
          Continue as Guest
        </button>
        <button onClick={logout} className="rounded-full border border-white/20 px-4 py-2 text-sm" type="button">
          Logout
        </button>
      </div>

      <p className="mt-4 text-sm text-[var(--color-text-muted)]">{status}</p>
      {session ? <p className="text-xs text-[var(--color-text-muted)]">Role: {session.role}</p> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form onSubmit={register} className="space-y-2">
          <p className="text-sm text-[var(--color-text-soft)]">Create Account</p>
          <input name="registerEmail" type="email" placeholder="email" required className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm" />
          <input name="registerUsername" placeholder="username" required className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm" />
          <input name="registerDisplayName" placeholder="display name" required className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm" />
          <input name="registerPassword" type="password" placeholder="password" required className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm" />
          <button className="rounded-full border border-[var(--color-accent)]/60 px-4 py-2 text-sm" type="submit">Register</button>
        </form>

        <form onSubmit={login} className="space-y-2">
          <p className="text-sm text-[var(--color-text-soft)]">Login</p>
          <input name="loginEmail" type="email" placeholder="email" required className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm" />
          <input name="loginPassword" type="password" placeholder="password" required className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm" />
          <button className="rounded-full border border-[var(--color-accent)]/60 px-4 py-2 text-sm" type="submit">Login</button>
        </form>
      </div>
    </section>
  );
}
