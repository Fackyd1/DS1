import { SectionShell } from "@/components/layout/section-shell";
import { GameLauncher } from "@/components/projects/game-launcher";

export const metadata = {
  title: "Projects | DS1",
  description: "Portfolio completo de proyectos de Gaspar Doval.",
};

export default function ProjectsPage() {
  return (
    <SectionShell id="projects-page" eyebrow="PORTFOLIO" title="All Projects">
      <div className="space-y-8">
        <GameLauncher />
      </div>
    </SectionShell>
  );
}
