"use client";

import { FormEvent, useState } from "react";

type SubmitState = "idle" | "loading" | "success" | "error";

export function ContactForm() {
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      subject: String(formData.get("subject") ?? ""),
      message: String(formData.get("message") ?? ""),
      website: String(formData.get("website") ?? ""),
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(body.message ?? "Unable to send message.");
      }

      setState("success");
      setMessage("Message sent successfully. Thanks for reaching out.");
      event.currentTarget.reset();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Unable to send message.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-[var(--color-text-soft)]">
          Name
          <input
            name="name"
            required
            minLength={2}
            maxLength={80}
            className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-[var(--color-text)]"
          />
        </label>

        <label className="space-y-2 text-sm text-[var(--color-text-soft)]">
          Email
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-[var(--color-text)]"
          />
        </label>
      </div>

      <label className="space-y-2 text-sm text-[var(--color-text-soft)]">
        Subject
        <input
          name="subject"
          required
          minLength={4}
          maxLength={120}
          className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-[var(--color-text)]"
        />
      </label>

      <label className="space-y-2 text-sm text-[var(--color-text-soft)]">
        Message
        <textarea
          name="message"
          required
          minLength={20}
          maxLength={2000}
          rows={6}
          className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-[var(--color-text)]"
        />
      </label>

      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <button
        type="submit"
        disabled={state === "loading"}
        className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-bg)] disabled:opacity-60"
      >
        {state === "loading" ? "Sending..." : "Send Message"}
      </button>

      {message ? (
        <p className={state === "success" ? "text-sm text-green-300" : "text-sm text-rose-300"}>{message}</p>
      ) : null}
    </form>
  );
}
