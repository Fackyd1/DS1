import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getProjectBySlug } from "@/services/portfolio-service";

type ProjectDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProjectDetailPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return { title: "Project Not Found | DS1" };
  }

  return {
    title: `${project.name} | DS1`,
    description: project.description,
  };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <article className="px-6 pb-20 pt-36 md:px-12">
      <div className="mx-auto w-full max-w-5xl space-y-10">
        <header className="space-y-4">
          <Link href="/projects" className="text-sm text-[var(--color-text-muted)]">
            Back to projects
          </Link>
          <h1 className="font-display text-5xl text-[var(--color-text)]">{project.name}</h1>
          <p className="text-lg text-[var(--color-text-muted)]">{project.longDescription}</p>
        </header>

        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-white/10">
          <Image src={project.imageUrl} alt={`${project.name} hero image`} fill className="object-cover" sizes="100vw" />
        </div>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-2xl text-[var(--color-text)]">Problem</h2>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">{project.problem}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-2xl text-[var(--color-text)]">Solution</h2>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">{project.solution}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-2xl text-[var(--color-text)]">Technologies</h2>
          <ul className="mt-3 flex flex-wrap gap-2 text-sm text-[var(--color-text-soft)]">
            {project.technologies.map((tech) => (
              <li key={tech} className="rounded-full border border-white/15 px-3 py-1">
                {tech}
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-2xl text-[var(--color-text)]">Architecture</h2>
            <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-muted)]">
              {project.architecture.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-2xl text-[var(--color-text)]">Results</h2>
            <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-muted)]">
              {project.results.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="flex flex-wrap gap-3 text-sm">
          <a href={project.githubUrl} target="_blank" rel="noreferrer" className="rounded-full border border-white/20 px-4 py-2">
            GitHub
          </a>
          <a href={project.liveUrl} target="_blank" rel="noreferrer" className="rounded-full border border-white/20 px-4 py-2">
            Live Demo
          </a>
        </section>
      </div>
    </article>
  );
}
