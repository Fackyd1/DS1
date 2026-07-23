import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/types/portfolio";

type ProjectCardProps = {
  project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-colors hover:border-white/25">
      <div className="relative aspect-[16/10] overflow-hidden border-b border-white/10">
        <Image
          src={project.imageUrl}
          alt={`${project.name} cover image`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        />
      </div>

      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-white/15 px-2 py-1 text-[var(--color-text-soft)]">
            {project.category}
          </span>
          <span className="rounded-full border border-white/15 px-2 py-1 text-[var(--color-text-muted)]">
            {project.year}
          </span>
          <span className="rounded-full border border-[var(--color-accent)]/30 px-2 py-1 text-[var(--color-accent)]">
            {project.status}
          </span>
        </div>

        <div>
          <h3 className="text-xl text-[var(--color-text)]">{project.name}</h3>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">{project.description}</p>
        </div>

        <ul className="flex flex-wrap gap-2 text-xs text-[var(--color-text-muted)]">
          {project.technologies.map((tech) => (
            <li key={tech} className="rounded-full bg-white/5 px-2 py-1">
              {tech}
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href={`/projects/${project.slug}`}
            className="rounded-full bg-[var(--color-accent)] px-4 py-2 font-medium text-[var(--color-bg)]"
          >
            Case Study
          </Link>
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/20 px-4 py-2 text-[var(--color-text)]"
          >
            GitHub
          </a>
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/20 px-4 py-2 text-[var(--color-text)]"
          >
            Live Demo
          </a>
        </div>
      </div>
    </article>
  );
}
