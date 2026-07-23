import { SectionShell } from "@/components/layout/section-shell";
import { SkillsMatrix } from "@/components/skills/skills-matrix";

export const metadata = {
  title: "Skills | DS1",
  description: "Stack técnico y experiencia de Gaspar Doval.",
};

export default function SkillsPage() {
  return (
    <SectionShell id="skills-page" eyebrow="SKILLS" title="Technical Skill System">
      <SkillsMatrix />
    </SectionShell>
  );
}
