import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { fail, fromError, ok } from "@/lib/api/http";
import { loginSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message || "Invalid payload", 400);
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true, player: true },
    });

    if (!user || !user.passwordHash) {
      return fail("Invalid credentials.", 401);
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return fail("Invalid credentials.", 401);
    }

    const token = await createSession({
      userId: user.id,
      playerTag: user.player?.playerTag || `DS1_${user.username}`,
      role: (user.role.name as "ADMIN" | "EDITOR" | "USER") || "USER",
      mode: "account",
    });

    await setSessionCookie(token);

    return ok({ id: user.id, email: user.email, username: user.username, role: user.role.name });
  } catch (error) {
    return fromError(error);
  }
}
