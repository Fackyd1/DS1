import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { SessionPayload, UserRole } from "@/types/auth";

const SESSION_COOKIE = "ds1_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET must be set and at least 16 chars long.");
  }

  return new TextEncoder().encode(secret);
}

export async function createSession(payload: Omit<SessionPayload, "exp">): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secretKey());
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secretKey());

    const session: SessionPayload = {
      userId: payload.userId as string | undefined,
      playerTag: String(payload.playerTag ?? ""),
      role: String(payload.role ?? "GUEST") as UserRole,
      mode: String(payload.mode ?? "guest") as SessionPayload["mode"],
      exp: Number(payload.exp ?? 0),
    };

    if (!session.playerTag) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function requireSession(allowedRoles?: UserRole[]): Promise<SessionPayload> {
  const session = await readSession();

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    throw new Error("FORBIDDEN");
  }

  return session;
}

export function generateGuestTag(): string {
  const suffix = Math.floor(Math.random() * 9000 + 1000);
  return `DS1_${suffix}`;
}
