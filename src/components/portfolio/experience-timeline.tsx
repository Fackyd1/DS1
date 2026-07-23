import { getExperiences } from "@/services/portfolio-service";

export function ExperienceTimeline() {
  const experience = getExperiences();

  return (
    <ol className="space-y-6">
      {experience.map((item) => (
        <li key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl text-[var(--color-text)]">{item.role}</h3>
            <span className="text-sm text-[var(--color-accent)]">{item.company}</span>
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {item.startDate} - {item.endDate}
          </p>
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">{item.summary}</p>
          <ul className="mt-4 space-y-2 text-sm text-[var(--color-text-soft)]">
            {item.highlights.map((highlight) => (
              <li key={highlight}>- {highlight}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
