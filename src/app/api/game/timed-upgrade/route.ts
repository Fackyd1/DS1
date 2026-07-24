import { readSession } from "@/lib/auth/session";
import { fail, fromError, ok } from "@/lib/api/http";
import { runTimedUpgradeAction } from "@/services/realm-backend-service";

export async function POST() {
  try {
    const session = await readSession();
    if (!session) {
      return fail("Unauthorized", 401);
    }

    const result = await runTimedUpgradeAction(session.playerTag, session.userId);
    return ok(result);
  } catch (error) {
    return fromError(error);
  }
}