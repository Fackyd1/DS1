import { readSession } from "@/lib/auth/session";
import { fail, fromError, ok } from "@/lib/api/http";
import { hireSchema } from "@/lib/validation/schemas";
import { runHireAction } from "@/services/realm-backend-service";

export async function POST(request: Request) {
  try {
    const session = await readSession();
    if (!session) {
      return fail("Unauthorized", 401);
    }

    const body = await request.json();
    const parsed = hireSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message || "Invalid payload", 400);
    }

    const result = await runHireAction(session.playerTag, session.userId, parsed.data.worker);
    return ok(result);
  } catch (error) {
    return fromError(error);
  }
}
