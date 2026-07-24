import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  subject: z.string().trim().min(4).max(120),
  message: z.string().trim().min(20).max(2000),
});

export const projectSchema = z.object({
  slug: z.string().trim().min(3).max(100),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(300),
  longDescription: z.string().trim().min(20).max(5000),
  technologies: z.array(z.string().trim().min(1)).min(1),
  category: z.enum(["Web Development", "Full Stack", "Game Development", "Web3", "Creative Coding"]),
  year: z.number().int().min(2015).max(2100),
  status: z.enum(["Planning", "In Progress", "Completed"]),
  githubUrl: z.string().url(),
  liveUrl: z.string().url(),
  imageUrl: z.string().min(1),
  featured: z.boolean().default(false),
  problem: z.string().trim().min(20),
  solution: z.string().trim().min(20),
  architecture: z.array(z.string().trim().min(1)).min(1),
  results: z.array(z.string().trim().min(1)).min(1),
});

export const gatherSchema = z.object({
  action: z.enum(["WOOD", "STONE", "IRON"]),
});

export const buildSchema = z.object({
  building: z.enum(["WORKBENCH", "LUMBER_CAMP", "STONE_QUARRY", "IRON_MINE", "BLACKSMITH", "MARKET"]),
});

export const hireSchema = z.object({
  worker: z.enum(["LUMBERJACK", "MINER", "BLACKSMITH", "BUILDER"]),
});

export const sellSchema = z.object({
  resource: z.enum(["WOOD", "STONE", "IRON"]),
  amount: z.number().int().min(1).max(1000000),
});

export const timedUpgradeSchema = z.object({
  source: z.literal("auto").optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
});

export const registerSchema = z.object({
  email: z.string().trim().email(),
  username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().trim().min(2).max(80),
  password: z.string().min(8).max(72),
});
