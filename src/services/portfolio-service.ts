import { EXPERIENCES, PROJECTS, SKILLS } from "@/constants/portfolio-data";
import type { ExperienceItem, Project, ProjectCategory, Skill, SkillCategory } from "@/types/portfolio";

export type ProjectQuery = {
  search?: string;
  category?: ProjectCategory | "All";
};

export function getProjects(query?: ProjectQuery): Project[] {
  const search = query?.search?.trim().toLowerCase();

  return PROJECTS.filter((project) => {
    const categoryMatch = !query?.category || query.category === "All" || project.category === query.category;
    const searchMatch =
      !search ||
      project.name.toLowerCase().includes(search) ||
      project.description.toLowerCase().includes(search) ||
      project.technologies.some((tech) => tech.toLowerCase().includes(search));

    return categoryMatch && searchMatch;
  });
}

export function getProjectBySlug(slug: string): Project | null {
  return PROJECTS.find((project) => project.slug === slug) ?? null;
}

export function getFeaturedProjects(limit = 3): Project[] {
  return PROJECTS.filter((project) => project.featured).slice(0, limit);
}

export function getProjectCategories(): Array<ProjectCategory | "All"> {
  const categories = new Set<ProjectCategory>(PROJECTS.map((project) => project.category));
  return ["All", ...categories];
}

export function getSkills(): Skill[] {
  return SKILLS;
}

export function getSkillsByCategory(): Record<SkillCategory, Skill[]> {
  return SKILLS.reduce<Record<SkillCategory, Skill[]>>(
    (accumulator, skill) => {
      accumulator[skill.category].push(skill);
      return accumulator;
    },
    {
      Frontend: [],
      Backend: [],
      Database: [],
      "Game Development": [],
      Web3: [],
      Tools: [],
      Design: [],
    }
  );
}

export function getExperiences(): ExperienceItem[] {
  return EXPERIENCES;
}
