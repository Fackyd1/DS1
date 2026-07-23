import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { createSession, generateGuestTag, setSessionCookie } from "@/lib/auth/session";
import { fail, fromError, ok } from "@/lib/api/http";
import { registerSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message || "Invalid payload", 400);
    }

    const { email, username, displayName, password } = parsed.data;

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existing) {
      return fail("Email or username already exists.", 409);
    }

    let role = await prisma.role.findUnique({ where: { name: "USER" } });
    if (!role) {
      role = await prisma.role.create({ data: { name: "USER" } });
    }

    const user = await prisma.user.create({
      data: {
        email,
        username,
        displayName,
        passwordHash: await bcrypt.hash(password, 10),
        roleId: role.id,
      },
    });

    const token = await createSession({
      userId: user.id,
      playerTag: generateGuestTag(),
      role: "USER",
      mode: "account",
    });

    await setSessionCookie(token);

    return ok({ id: user.id, email: user.email, username: user.username, role: role.name }, 201);
  } catch (error) {
    return fromError(error);
  }
}
