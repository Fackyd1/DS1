import { readSession } from "@/lib/auth/session";
import { ok } from "@/lib/api/http";

export async function GET() {
  const session = await readSession();
  return ok({ session });
}
