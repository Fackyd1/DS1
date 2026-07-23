import Link from "next/link";
import { getFeaturedProjects } from "@/services/portfolio-service";
import { ProjectCard } from "@/components/projects/project-card";

export function SelectedWork() {
  const projects = getFeaturedProjects(2);

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
      <Link
        href="/projects"
        className="inline-flex rounded-full border border-white/20 px-5 py-2 text-sm text-[var(--color-text)]"
      >
        Explore Full Portfolio
      </Link>
    </div>
  );
}
