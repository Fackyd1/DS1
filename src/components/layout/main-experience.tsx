"use client";

import Link from "next/link";
import { useState } from "react";
import { RealmHero } from "@/components/hero/realm-hero";
import { SectionShell } from "@/components/layout/section-shell";
import { SelectedWork } from "@/components/portfolio/selected-work";

export function MainExperience() {
  const [skipIntro, setSkipIntro] = useState(false);

  return (
    <>
      <RealmHero skipIntro={skipIntro} onSkipIntro={() => setSkipIntro(true)} />

      <SectionShell id="about" eyebrow="ABOUT" title="The Guild">
        <p className="max-w-3xl text-[var(--color-text-muted)]">
          I design and build full digital products end-to-end, from interaction concepts to production
          architecture. This realm is structured as a professional operating system: portfolio, game loop,
          backend workflows and optional Web3 modules under one coherent experience.
        </p>
      </SectionShell>

      <SectionShell id="projects" eyebrow="SELECTED WORK" title="The Archives">
        <SelectedWork />
      </SectionShell>

      <SectionShell id="skills" eyebrow="SKILLS" title="The Workshop">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            "React",
            "Next.js",
            "TypeScript",
            "Node.js",
            "SQL",
            "Three.js",
            "Phaser",
            "Web3",
          ].map((skill) => (
            <div key={skill} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-[var(--color-text-soft)]">
              {skill}
            </div>
          ))}
        </div>
        <Link
          href="/skills"
          className="mt-6 inline-flex rounded-full border border-white/20 px-5 py-2 text-sm text-[var(--color-text)]"
        >
          View Full Skills System
        </Link>
      </SectionShell>

      <SectionShell id="realm" eyebrow="REALM" title="The Developer's Realm">
        <p className="max-w-3xl text-[var(--color-text-muted)]">
          Realm navigation, world zones and game systems are now scaffold-ready from this visual foundation.
          The &quot;Play The Realm&quot; path is active through this section while gameplay systems will be built in
          dedicated phases.
        </p>
        <Link
          href="/realm"
          className="mt-6 inline-flex rounded-full border border-[var(--color-accent)]/60 px-5 py-2 text-sm text-[var(--color-text)]"
        >
          Open Realm Hub
        </Link>
      </SectionShell>

      <SectionShell id="contact" eyebrow="CONTACT" title="Communication Terminal">
        <p className="max-w-3xl text-[var(--color-text-muted)]">
          Contact terminal is active with frontend and server-side validation, ready to connect to persistent
          storage in the database phase.
        </p>
        <Link
          href="/contact"
          className="mt-6 inline-flex rounded-full border border-white/20 px-5 py-2 text-sm text-[var(--color-text)]"
        >
          Go To Contact Terminal
        </Link>
      </SectionShell>
    </>
  );
}
