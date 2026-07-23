import { SectionShell } from "@/components/layout/section-shell";
import { ExperienceTimeline } from "@/components/portfolio/experience-timeline";

export const metadata = {
  title: "Experience | DS1",
  description: "Recorrido profesional y enfoque de producto de Gaspar Doval.",
};

export default function ExperiencePage() {
  return (
    <SectionShell id="experience-page" eyebrow="EXPERIENCE" title="Professional Journey">
      <ExperienceTimeline />
    </SectionShell>
  );
}
