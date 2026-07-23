import { createSession, generateGuestTag, setSessionCookie } from "@/lib/auth/session";
import { fromError, ok } from "@/lib/api/http";

export async function POST() {
  try {
    const playerTag = generateGuestTag();
    const token = await createSession({
      playerTag,
      role: "GUEST",
      mode: "guest",
    });

    await setSessionCookie(token);

    return ok({ playerTag, mode: "guest" }, 201);
  } catch (error) {
    return fromError(error);
  }
}
