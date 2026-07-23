import { requireSession } from "@/lib/auth/session";
import { fromError, ok } from "@/lib/api/http";
import { QUESTS } from "@/game/data/balance";

export async function GET() {
  try {
    await requireSession(["ADMIN", "EDITOR"]);
    return ok({ quests: QUESTS });
  } catch (error) {
    return fromError(error);
  }
}
