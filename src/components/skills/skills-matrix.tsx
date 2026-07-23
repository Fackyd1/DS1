import Link from "next/link";
import { getSkillsByCategory } from "@/services/portfolio-service";

export function SkillsMatrix() {
  const grouped = getSkillsByCategory();

  return (
    <div className="space-y-10">
      {Object.entries(grouped).map(([category, skills]) => (
        <section key={category} className="space-y-4">
          <h3 className="text-2xl text-[var(--color-text)]">{category}</h3>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {skills.map((skill) => (
              <article key={skill.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg text-[var(--color-text)]">{skill.name}</h4>
                  <span className="text-xs text-[var(--color-accent)]">{skill.level}</span>
                </div>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">{skill.description}</p>
                <p className="mt-3 text-xs text-[var(--color-text-muted)]">Experience: {skill.years} years</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {skill.relatedProjectSlugs.map((slug) => (
                    <Link
                      key={slug}
                      href={`/projects/${slug}`}
                      className="rounded-full border border-white/15 px-2 py-1 text-xs text-[var(--color-text-soft)]"
                    >
                      {slug}
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
