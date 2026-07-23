export type ProjectCategory =
  | "Web Development"
  | "Full Stack"
  | "Game Development"
  | "Web3"
  | "Creative Coding";

export type ProjectStatus = "Planning" | "In Progress" | "Completed";

export type Project = {
  id: string;
  slug: string;
  name: string;
  description: string;
  longDescription: string;
  technologies: string[];
  category: ProjectCategory;
  year: number;
  status: ProjectStatus;
  githubUrl: string;
  liveUrl: string;
  imageUrl: string;
  featured: boolean;
  problem: string;
  solution: string;
  architecture: string[];
  results: string[];
};

export type SkillCategory =
  | "Frontend"
  | "Backend"
  | "Database"
  | "Game Development"
  | "Web3"
  | "Tools"
  | "Design";

export type SkillLevel = "Beginner" | "Intermediate" | "Advanced";

export type Skill = {
  id: string;
  name: string;
  category: SkillCategory;
  level: SkillLevel;
  years: number;
  description: string;
  relatedProjectSlugs: string[];
};

export type ExperienceItem = {
  id: string;
  role: string;
  company: string;
  startDate: string;
  endDate: string;
  summary: string;
  highlights: string[];
};
