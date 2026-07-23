"use client";

import { FormEvent, useEffect, useState } from "react";

type Project = {
  id: string;
  slug: string;
  name: string;
  category: string;
  year: number;
  status: string;
};

const defaultPayload = {
  slug: "",
  name: "",
  description: "",
  longDescription: "",
  technologies: "Next.js,TypeScript",
  category: "Full Stack",
  year: new Date().getFullYear(),
  status: "In Progress",
  githubUrl: "https://github.com/",
  liveUrl: "https://example.com",
  imageUrl: "/images/projects/ds1-realm.svg",
  featured: false,
  problem: "Problem statement goes here with enough detail.",
  solution: "Solution statement goes here with enough detail.",
  architecture: "Modular architecture",
  results: "Functional milestone reached",
};

export function AdminDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [message, setMessage] = useState("");

  async function loadProjects() {
    const response = await fetch("/api/projects", { cache: "no-store" });
    const body = (await response.json()) as { projects: Project[] };
    setProjects(body.projects);
  }

  useEffect(() => {
    loadProjects().catch(() => setMessage("Unable to load projects."));
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const payload = {
      slug: String(form.get("slug") ?? defaultPayload.slug),
      name: String(form.get("name") ?? defaultPayload.name),
      description: String(form.get("description") ?? defaultPayload.description),
      longDescription: String(form.get("longDescription") ?? defaultPayload.longDescription),
      technologies: String(form.get("technologies") ?? defaultPayload.technologies)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      category: String(form.get("category") ?? defaultPayload.category),
      year: Number(form.get("year") ?? defaultPayload.year),
      status: String(form.get("status") ?? defaultPayload.status),
      githubUrl: String(form.get("githubUrl") ?? defaultPayload.githubUrl),
      liveUrl: String(form.get("liveUrl") ?? defaultPayload.liveUrl),
      imageUrl: String(form.get("imageUrl") ?? defaultPayload.imageUrl),
      featured: String(form.get("featured") ?? "off") === "on",
      problem: String(form.get("problem") ?? defaultPayload.problem),
      solution: String(form.get("solution") ?? defaultPayload.solution),
      architecture: String(form.get("architecture") ?? defaultPayload.architecture)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      results: String(form.get("results") ?? defaultPayload.results)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setMessage(body.message || "Failed to create project.");
      return;
    }

    setMessage("Project created.");
    event.currentTarget.reset();
    await loadProjects();
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-2xl text-[var(--color-text)]">Projects</h2>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">Total: {projects.length}</p>
        <ul className="mt-4 space-y-2 text-sm text-[var(--color-text-muted)]">
          {projects.slice(0, 8).map((project) => (
            <li key={project.id}>
              {project.name} · {project.category} · {project.status}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-2xl text-[var(--color-text)]">Create Project</h2>
        <form onSubmit={handleCreate} className="mt-4 grid gap-3 md:grid-cols-2">
          <input name="slug" placeholder="slug" className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm" required />
          <input name="name" placeholder="name" className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm" required />
          <input name="description" placeholder="description" className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm md:col-span-2" required />
          <textarea name="longDescription" placeholder="long description" className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm md:col-span-2" required />
          <input name="technologies" placeholder="tech1,tech2" className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm" required />
          <input name="category" placeholder="Full Stack" className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm" required />
          <input name="year" type="number" placeholder="2026" className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm" required />
          <input name="status" placeholder="In Progress" className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm" required />
          <input name="githubUrl" placeholder="https://github.com/..." className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm" required />
          <input name="liveUrl" placeholder="https://..." className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm" required />
          <input name="imageUrl" placeholder="/images/projects/..." className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm" required />
          <label className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <input name="featured" type="checkbox" /> Featured
          </label>
          <textarea name="problem" placeholder="problem" className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm md:col-span-2" required />
          <textarea name="solution" placeholder="solution" className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm md:col-span-2" required />
          <input name="architecture" placeholder="item1,item2" className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm" required />
          <input name="results" placeholder="item1,item2" className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm" required />
          <button className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-bg)] md:col-span-2" type="submit">
            Save Project
          </button>
        </form>
        {message ? <p className="mt-3 text-sm text-[var(--color-text-muted)]">{message}</p> : null}
      </section>
    </div>
  );
}
