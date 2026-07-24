import { readSession } from "@/lib/auth/session";
import { fail, ok } from "@/lib/api/http";
import { getRealmDepositStatus } from "@/services/realm-backend-service";

export async function GET(request: Request) {
  const session = await readSession();
  if (!session) {
    return fail("Unauthorized", 401);
  }

  const { searchParams } = new URL(request.url);
  const intentId = searchParams.get("intentId")?.trim();

  if (!intentId) {
    return fail("intentId is required", 400);
  }

  const status = await getRealmDepositStatus(session.playerTag, intentId);
  return ok(status);
}
