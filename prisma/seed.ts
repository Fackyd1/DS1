import { PrismaClient } from "@prisma/client";
import { PROJECTS, SKILLS, EXPERIENCES } from "../src/constants/portfolio-data";
import { QUESTS, ACHIEVEMENTS } from "../src/game/data/balance";

const prisma = new PrismaClient();

async function seedRoles() {
  for (const name of ["ADMIN", "EDITOR", "USER"]) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

async function seedProjectsAndSkills() {
  for (const project of PROJECTS) {
    await prisma.project.upsert({
      where: { slug: project.slug },
      update: {
        name: project.name,
        description: project.description,
        longDescription: project.longDescription,
        technologies: project.technologies,
        category: project.category,
        year: project.year,
        status: project.status,
        githubUrl: project.githubUrl,
        liveUrl: project.liveUrl,
        imageUrl: project.imageUrl,
        featured: project.featured,
        problem: project.problem,
        solution: project.solution,
        architecture: project.architecture,
        results: project.results,
      },
      create: {
        slug: project.slug,
        name: project.name,
        description: project.description,
        longDescription: project.longDescription,
        technologies: project.technologies,
        category: project.category,
        year: project.year,
        status: project.status,
        githubUrl: project.githubUrl,
        liveUrl: project.liveUrl,
        imageUrl: project.imageUrl,
        featured: project.featured,
        problem: project.problem,
        solution: project.solution,
        architecture: project.architecture,
        results: project.results,
      },
    });
  }

  for (const skill of SKILLS) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {
        category: skill.category,
        level: skill.level,
        years: skill.years,
        description: skill.description,
      },
      create: {
        name: skill.name,
        category: skill.category,
        level: skill.level,
        years: skill.years,
        description: skill.description,
      },
    });
  }

  for (const skill of SKILLS) {
    for (const slug of skill.relatedProjectSlugs) {
      await prisma.project.update({
        where: { slug },
        data: {
          skills: {
            connect: [{ name: skill.name }],
          },
        },
      });
    }
  }
}

async function seedExperience() {
  for (const item of EXPERIENCES) {
    await prisma.experience.upsert({
      where: { id: item.id },
      update: {
        role: item.role,
        company: item.company,
        startDate: item.startDate,
        endDate: item.endDate,
        summary: item.summary,
        highlights: item.highlights,
      },
      create: {
        id: item.id,
        role: item.role,
        company: item.company,
        startDate: item.startDate,
        endDate: item.endDate,
        summary: item.summary,
        highlights: item.highlights,
      },
    });
  }
}

async function seedQuestsAndAchievements() {
  for (const quest of QUESTS) {
    await prisma.quest.upsert({
      where: { key: quest.key },
      update: {
        title: quest.title,
        description: `${quest.metric} target ${quest.target}`,
        xpReward: quest.xpReward,
        goldReward: quest.goldReward,
        achievement: quest.achievement,
      },
      create: {
        key: quest.key,
        title: quest.title,
        description: `${quest.metric} target ${quest.target}`,
        xpReward: quest.xpReward,
        goldReward: quest.goldReward,
        achievement: quest.achievement,
      },
    });
  }

  for (const [key, value] of Object.entries(ACHIEVEMENTS)) {
    await prisma.achievement.upsert({
      where: { key },
      update: {
        title: value.title,
        description: value.description,
      },
      create: {
        key,
        title: value.title,
        description: value.description,
      },
    });
  }
}

async function main() {
  await seedRoles();
  await seedProjectsAndSkills();
  await seedExperience();
  await seedQuestsAndAchievements();
  console.log("Seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
