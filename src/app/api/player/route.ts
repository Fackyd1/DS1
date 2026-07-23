import { createSession, generateGuestTag, readSession, setSessionCookie } from "@/lib/auth/session";
import { ok, fromError } from "@/lib/api/http";
import { getOrCreatePlayer } from "@/services/game-service";

export async function GET() {
  try {
    let session = await readSession();

    if (!session) {
      const playerTag = generateGuestTag();
      const token = await createSession({ role: "GUEST", mode: "guest", playerTag });
      await setSessionCookie(token);
      session = { role: "GUEST", mode: "guest", playerTag, exp: Math.floor(Date.now() / 1000) + 86400 };
    }

    const player = getOrCreatePlayer(session.playerTag, session.userId);

    return ok({ player, session });
  } catch (error) {
    return fromError(error);
  }
}
