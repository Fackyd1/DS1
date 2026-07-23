import { randomUUID } from "crypto";
import { requireSession } from "@/lib/auth/session";
import { fail, fromError, ok } from "@/lib/api/http";
import { prisma } from "@/lib/db/prisma";
import { projectSchema } from "@/lib/validation/schemas";
import { PROJECTS } from "@/constants/portfolio-data";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({ orderBy: { year: "desc" } });
    if (projects.length > 0) {
      return ok({ projects });
    }
  } catch {
    // fallback for environments without configured DB
  }

  return ok({ projects: PROJECTS });
}

export async function POST(request: Request) {
  try {
    await requireSession(["ADMIN", "EDITOR"]);

    const body = await request.json();
    const parsed = projectSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message || "Invalid payload", 400);
    }

    const exists = PROJECTS.some((item) => item.slug === parsed.data.slug);
    if (exists) {
      return fail("Project slug already exists", 409);
    }

    const record = { ...parsed.data, id: randomUUID() };

    try {
      await prisma.project.create({
        data: {
          ...parsed.data,
          technologies: parsed.data.technologies,
          architecture: parsed.data.architecture,
          results: parsed.data.results,
        },
      });
    } catch {
      PROJECTS.unshift(record);
    }

    return ok({ project: record }, 201);
  } catch (error) {
    return fromError(error);
  }
}
