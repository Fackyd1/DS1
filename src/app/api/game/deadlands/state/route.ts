import { createSession, generateGuestTag, readSession, setSessionCookie } from "@/lib/auth/session";
import { fail, fromError, ok } from "@/lib/api/http";
import { loadDeadlandsSnapshot, saveDeadlandsSnapshot } from "@/services/deadlands-save-service";

async function ensureSession() {
  let session = await readSession();

  if (!session) {
    const playerTag = generateGuestTag();
    const token = await createSession({ role: "GUEST", mode: "guest", playerTag });
    await setSessionCookie(token);
    session = {
      role: "GUEST",
      mode: "guest",
      playerTag,
      exp: Math.floor(Date.now() / 1000) + 86400,
    };
  }

  return session;
}

export async function GET() {
  try {
    const session = await ensureSession();
    const snapshot = await loadDeadlandsSnapshot(session.playerTag, session.userId);
    return ok({ snapshot, session });
  } catch (error) {
    return fromError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await ensureSession();
    const body = (await request.json()) as { snapshot?: unknown };

    if (body.snapshot === undefined) {
      return fail("snapshot is required", 400);
    }

    const snapshot = await saveDeadlandsSnapshot(session.playerTag, session.userId, body.snapshot);
    return ok({ snapshot, session, saved: true });
  } catch (error) {
    return fromError(error);
  }
}
