import { readSession } from "@/lib/auth/session";
import { fail, ok } from "@/lib/api/http";
import { getRealmDepositStatus } from "@/services/realm-backend-service";

export async function GET(request: Request) {
  const session = await readSession();

  const { searchParams } = new URL(request.url);
  const intentId = searchParams.get("intentId")?.trim();
  const playerTagParam = searchParams.get("playerTag")?.trim();
  const playerTag = session?.playerTag || playerTagParam;

  if (!intentId) {
    return fail("intentId is required", 400);
  }

  if (!playerTag) {
    return fail("playerTag is required when there is no active session", 400);
  }

  const status = await getRealmDepositStatus(playerTag, intentId);
  return ok(status);
}
