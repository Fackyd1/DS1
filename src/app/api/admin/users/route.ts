import { requireSession } from "@/lib/auth/session";
import { fromError, ok } from "@/lib/api/http";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    await requireSession(["ADMIN"]);

    const users = await prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return ok({
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role.name,
        createdAt: user.createdAt,
      })),
    });
  } catch (error) {
    return fromError(error);
  }
}
