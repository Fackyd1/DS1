"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useScroll } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useGameShell } from "@/components/game/game-shell-context";

const NAV_ITEMS = [
  { label: "About", href: "/about" },
  { label: "Projects", href: "/projects" },
  { label: "Skills", href: "/skills" },
  { label: "Realm", href: "/realm" },
  { label: "Contact", href: "/contact" },
] as const;

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { closeGame, isPlaying, setMenuOpen } = useGameShell();
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    setMenuOpen(isOpen);
    return () => {
      document.body.style.overflow = "";
      setMenuOpen(false);
    };
  }, [isOpen, setMenuOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <motion.div
        className="h-[2px] origin-left bg-[var(--color-accent)]"
        style={{ scaleX: scrollYProgress }}
      />

      <nav
        aria-label="Main navigation"
        className={[
          "mx-auto mt-3 flex w-[min(1100px,94vw)] items-center justify-between rounded-2xl border px-4 py-3 md:px-6",
          "backdrop-blur-md transition-colors duration-300",
          isScrolled
            ? "border-white/20 bg-[var(--color-bg-soft)]/80"
            : "border-white/10 bg-[var(--color-bg)]/65",
        ].join(" ")}
      >
        <Link
          href="/"
          className="font-display text-xl tracking-[0.18em] text-[var(--color-text)]"
          aria-label="DS1 home"
        >
          DS1
        </Link>

        <ul className="hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden md:block">
          {isPlaying ? (
            <button
              type="button"
              onClick={closeGame}
              className="rounded-full border border-[var(--color-accent)]/60 px-4 py-2 text-xs font-semibold tracking-[0.12em] text-[var(--color-text)] transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            >
              CLOSE GAME
            </button>
          ) : (
            <Link
              href="/realm"
              className="rounded-full border border-[var(--color-accent)]/60 px-4 py-2 text-xs font-semibold tracking-[0.12em] text-[var(--color-text)] transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            >
              PLAY THE REALM
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          className="inline-flex items-center justify-center rounded-md border border-white/15 p-2 text-[var(--color-text)] md:hidden"
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-auto mt-2 w-[min(1100px,94vw)] rounded-2xl border border-white/15 bg-[var(--color-bg-soft)]/95 p-5 backdrop-blur-lg md:hidden"
          >
            <ul className="space-y-4">
              {NAV_ITEMS.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="block rounded-lg px-2 py-1 text-lg text-[var(--color-text)]"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/realm"
              onClick={() => setIsOpen(false)}
              className="mt-6 block rounded-xl border border-[var(--color-accent)]/70 px-3 py-3 text-center text-sm font-semibold tracking-[0.12em] text-[var(--color-text)]"
            >
              {isPlaying ? "CLOSE GAME" : "PLAY THE REALM"}
            </Link>
            {isPlaying ? (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  closeGame();
                }}
                className="mt-3 block w-full rounded-xl border border-[var(--color-accent)]/70 px-3 py-3 text-center text-sm font-semibold tracking-[0.12em] text-[var(--color-text)]"
              >
                CLOSE GAME
              </button>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
