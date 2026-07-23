import { requireSession } from "@/lib/auth/session";
import { fromError, ok } from "@/lib/api/http";
import { ACHIEVEMENTS } from "@/game/data/balance";

export async function GET() {
  try {
    await requireSession(["ADMIN", "EDITOR"]);
    return ok({ achievements: ACHIEVEMENTS });
  } catch (error) {
    return fromError(error);
  }
}
