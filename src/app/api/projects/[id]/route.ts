import { requireSession } from "@/lib/auth/session";
import { fail, fromError, ok } from "@/lib/api/http";
import { prisma } from "@/lib/db/prisma";
import { projectSchema } from "@/lib/validation/schemas";
import { PROJECTS } from "@/constants/portfolio-data";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: RouteProps) {
  const { id } = await params;

  try {
    const dbProject = await prisma.project.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (dbProject) {
      return ok({ project: dbProject });
    }
  } catch {
    // fallback for environments without configured DB
  }

  const project = PROJECTS.find((item) => item.slug === id || item.id === id);
  if (!project) {
    return fail("Project not found", 404);
  }

  return ok({ project });
}

export async function PUT(request: Request, { params }: RouteProps) {
  try {
    await requireSession(["ADMIN", "EDITOR"]);
    const { id } = await params;
    const body = await request.json();
    const parsed = projectSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message || "Invalid payload", 400);
    }

    const index = PROJECTS.findIndex((item) => item.id === id);
    try {
      const project = await prisma.project.update({
        where: { id },
        data: {
          ...parsed.data,
          technologies: parsed.data.technologies,
          architecture: parsed.data.architecture,
          results: parsed.data.results,
        },
      });

      return ok({ project });
    } catch {
      if (index === -1) {
        return fail("Project not found", 404);
      }

      PROJECTS[index] = { ...PROJECTS[index], ...parsed.data };
      return ok({ project: PROJECTS[index] });
    }
  } catch (error) {
    return fromError(error);
  }
}

export async function DELETE(_: Request, { params }: RouteProps) {
  try {
    await requireSession(["ADMIN"]);
    const { id } = await params;

    try {
      const project = await prisma.project.delete({ where: { id } });
      return ok({ project });
    } catch {
      const index = PROJECTS.findIndex((item) => item.id === id);
      if (index === -1) {
        return fail("Project not found", 404);
      }

      const [removed] = PROJECTS.splice(index, 1);
      return ok({ project: removed });
    }
  } catch (error) {
    return fromError(error);
  }
}
