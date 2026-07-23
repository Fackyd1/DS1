"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Project, ProjectCategory } from "@/types/portfolio";
import { ProjectCard } from "@/components/projects/project-card";

type ProjectsExplorerProps = {
  initialProjects: Project[];
  categories: Array<ProjectCategory | "All">;
};

type ViewMode = "grid" | "featured";

export function ProjectsExplorer({ initialProjects, categories }: ProjectsExplorerProps) {
  const shouldReduceMotion = useReducedMotion();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ProjectCategory | "All">("All");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return initialProjects.filter((project) => {
      const categoryMatch = category === "All" || project.category === category;
      const searchMatch =
        normalized.length === 0 ||
        project.name.toLowerCase().includes(normalized) ||
        project.description.toLowerCase().includes(normalized) ||
        project.technologies.some((tech) => tech.toLowerCase().includes(normalized));

      return categoryMatch && searchMatch;
    });
  }, [category, initialProjects, search]);

  const featured = filtered.filter((project) => project.featured);

  return (
    <div className="space-y-6">
      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12 }}
        whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-[1fr_auto_auto]"
      >
        <label className="space-y-2">
          <span className="text-xs tracking-[0.14em] text-[var(--color-text-muted)]">SEARCH</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or stack"
            className="w-full rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs tracking-[0.14em] text-[var(--color-text-muted)]">CATEGORY</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as ProjectCategory | "All")}
            className="h-[42px] rounded-xl border border-white/20 bg-black/20 px-3 text-sm text-[var(--color-text)]"
          >
            {categories.map((item) => (
              <option key={item} value={item} className="bg-[var(--color-bg-soft)]">
                {item}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="space-y-2">
          <legend className="text-xs tracking-[0.14em] text-[var(--color-text-muted)]">VIEW</legend>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={[
                "rounded-xl px-3 py-2 text-sm",
                viewMode === "grid"
                  ? "bg-[var(--color-accent)] text-[var(--color-bg)]"
                  : "border border-white/20 text-[var(--color-text)]",
              ].join(" ")}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode("featured")}
              className={[
                "rounded-xl px-3 py-2 text-sm",
                viewMode === "featured"
                  ? "bg-[var(--color-accent)] text-[var(--color-bg)]"
                  : "border border-white/20 text-[var(--color-text)]",
              ].join(" ")}
            >
              Featured
            </button>
          </div>
        </fieldset>
      </motion.div>

      <p className="text-sm text-[var(--color-text-muted)]">Showing {filtered.length} projects</p>

      <motion.div
        layout
        className={viewMode === "featured" ? "grid gap-5 md:grid-cols-2" : "grid gap-5 md:grid-cols-2 xl:grid-cols-3"}
      >
        <AnimatePresence mode="popLayout">
          {(viewMode === "featured" ? featured : filtered).map((project) => (
            <motion.div
              key={project.id}
              layout
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 18, scale: 0.98 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {viewMode === "featured" && featured.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">No featured projects match your current filters.</p>
      ) : null}
    </div>
  );
}
