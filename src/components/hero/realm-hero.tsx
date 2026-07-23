"use client";

import {
  motion,
  useMotionTemplate,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import type { Variants } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

const titleLines = ["FULL STACK DEVELOPER", "GAME DEVELOPER", "CREATIVE TECHNOLOGIST"];

const heroVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: "easeOut",
      staggerChildren: 0.08,
    },
  },
};

type HeroProps = {
  skipIntro: boolean;
  onSkipIntro: () => void;
};

export function RealmHero({ skipIntro, onSkipIntro }: HeroProps) {
  const shouldReduceMotion = useReducedMotion();
  const [pointer, setPointer] = useState({ x: 50, y: 50 });
  const springX = useSpring(pointer.x, { stiffness: 85, damping: 20, mass: 0.6 });
  const springY = useSpring(pointer.y, { stiffness: 85, damping: 20, mass: 0.6 });
  const xPos = useTransform(springX, (value) => `${value}%`);
  const yPos = useTransform(springY, (value) => `${value}%`);
  const dynamicBackground = useMotionTemplate`radial-gradient(520px circle at ${xPos} ${yPos}, color-mix(in srgb, var(--color-accent) 16%, transparent), transparent 60%)`;

  const animateIn = !skipIntro && !shouldReduceMotion;

  return (
    <section
      aria-label="Hero"
      className="relative isolate flex min-h-[96vh] flex-col justify-center overflow-hidden px-6 pb-20 pt-36 md:px-12"
      onMouseMove={(event) => {
        if (shouldReduceMotion) return;

        const { left, top, width, height } = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - left) / width) * 100;
        const y = ((event.clientY - top) / height) * 100;
        setPointer({ x, y });
      }}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={shouldReduceMotion ? undefined : { background: dynamicBackground }}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 -z-20 h-[70vh] bg-[radial-gradient(60%_50%_at_50%_0%,rgba(214,196,160,0.13),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 -z-30 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:42px_42px]" />

      <motion.div
        variants={heroVariants}
        initial={animateIn ? "hidden" : false}
        animate={animateIn ? "visible" : false}
        className="mx-auto w-full max-w-6xl"
      >
        <p className="font-display text-[clamp(2.7rem,7vw,7rem)] uppercase leading-[0.88] tracking-[0.03em] text-[var(--color-text)]">
          DS1
        </p>

        <motion.h1
          variants={heroVariants}
          className="mt-2 max-w-4xl text-[clamp(1.7rem,4vw,4rem)] font-semibold leading-tight text-[var(--color-text-soft)]"
        >
          GASPAR DOVAL
        </motion.h1>

        <div className="mt-6 grid gap-2 text-sm tracking-[0.12em] text-[var(--color-text-muted)] md:grid-cols-3 md:gap-6 md:text-base">
          {titleLines.map((line) => (
            <motion.p key={line} variants={heroVariants}>
              {line}
            </motion.p>
          ))}
        </div>

        <motion.p
          variants={heroVariants}
          className="mt-10 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)] md:text-lg"
        >
          Building digital worlds, interactive experiences and intelligent systems.
        </motion.p>

        <motion.div variants={heroVariants} className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/realm"
            className="rounded-full bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold tracking-[0.1em] text-[var(--color-bg)] transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
          >
            ENTER THE REALM
          </Link>
          <Link
            href="/projects"
            className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold tracking-[0.1em] text-[var(--color-text)] transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
          >
            VIEW MY WORK
          </Link>
          <button
            type="button"
            onClick={onSkipIntro}
            className="rounded-full border border-transparent px-5 py-3 text-sm text-[var(--color-text-muted)] underline decoration-white/25 underline-offset-4 transition-colors hover:text-[var(--color-text)]"
          >
            SKIP INTRO
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
}
