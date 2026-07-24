import { readSession } from "@/lib/auth/session";
import { fail, fromError, ok } from "@/lib/api/http";
import { gatherSchema } from "@/lib/validation/schemas";
import { runGatherAction } from "@/services/realm-backend-service";

export async function POST(request: Request) {
  try {
    const session = await readSession();
    if (!session) {
      return fail("Unauthorized", 401);
    }

    const body = await request.json();
    const parsed = gatherSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message || "Invalid payload", 400);
    }

    const result = await runGatherAction(session.playerTag, session.userId, parsed.data.action);
    return ok(result);
  } catch (error) {
    return fromError(error);
  }
}
