import { readSession } from "@/lib/auth/session";
import { fail, fromError, ok } from "@/lib/api/http";
import { sellSchema } from "@/lib/validation/schemas";
import { sellResource } from "@/services/game-service";

export async function POST(request: Request) {
  try {
    const session = await readSession();
    if (!session) {
      return fail("Unauthorized", 401);
    }

    const body = await request.json();
    const parsed = sellSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message || "Invalid payload", 400);
    }

    const result = sellResource(session.playerTag, parsed.data.resource, parsed.data.amount);
    return ok(result);
  } catch (error) {
    return fromError(error);
  }
}
