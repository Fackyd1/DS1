import type { ReactNode } from "react";

type SectionShellProps = {
  id: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
};

export function SectionShell({ id, eyebrow, title, children }: SectionShellProps) {
  return (
    <section id={id} className="scroll-mt-28 px-6 py-16 md:px-12 md:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <p className="text-xs tracking-[0.16em] text-[var(--color-text-muted)]">{eyebrow}</p>
        <h2 className="mt-3 font-display text-3xl text-[var(--color-text)] md:text-5xl">{title}</h2>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}
