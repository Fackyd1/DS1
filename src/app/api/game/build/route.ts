import { readSession } from "@/lib/auth/session";
import { fail, fromError, ok } from "@/lib/api/http";
import { buildSchema } from "@/lib/validation/schemas";
import { buildStructure } from "@/services/game-service";

export async function POST(request: Request) {
  try {
    const session = await readSession();
    if (!session) {
      return fail("Unauthorized", 401);
    }

    const body = await request.json();
    const parsed = buildSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message || "Invalid payload", 400);
    }

    const result = buildStructure(session.playerTag, parsed.data.building);
    return ok(result);
  } catch (error) {
    return fromError(error);
  }
}
