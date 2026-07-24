import { SectionShell } from "@/components/layout/section-shell";
import { GameLauncher } from "@/components/projects/game-launcher";
import { ProjectsExplorer } from "@/components/projects/projects-explorer";
import { getProjectCategories, getProjects } from "@/services/portfolio-service";

export const metadata = {
  title: "Projects | DS1",
  description: "Portfolio completo de proyectos de Gaspar Doval.",
};

export default function ProjectsPage() {
  const projects = getProjects();
  const categories = getProjectCategories();

  return (
    <SectionShell id="projects-page" eyebrow="PORTFOLIO" title="All Projects">
      <div className="space-y-8">
        <GameLauncher />
        <ProjectsExplorer initialProjects={projects} categories={categories} />
      </div>
    </SectionShell>
  );
}
