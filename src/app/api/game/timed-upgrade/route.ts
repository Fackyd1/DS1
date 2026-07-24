import { readSession } from "@/lib/auth/session";
import { fail, fromError, ok } from "@/lib/api/http";
import { claimTimedUpgrade } from "@/services/game-service";

export async function POST() {
  try {
    const session = await readSession();
    if (!session) {
      return fail("Unauthorized", 401);
    }

    const result = claimTimedUpgrade(session.playerTag);
    return ok(result);
  } catch (error) {
    return fromError(error);
  }
}