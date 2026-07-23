import { SectionShell } from "@/components/layout/section-shell";

export const metadata = {
  title: "About | DS1",
  description: "Perfil profesional de Gaspar Doval.",
};

export default function AboutPage() {
  return (
    <SectionShell id="about-page" eyebrow="ABOUT" title="The Guild">
      <div className="max-w-3xl space-y-4 text-[var(--color-text-muted)]">
        <p>
          I build complete digital products, combining software architecture, frontend craft,
          backend reliability and interactive systems.
        </p>
        <p>
          My focus is creating experiences that are both technically rigorous and emotionally memorable.
        </p>
      </div>
    </SectionShell>
  );
}
