import { clearSessionCookie } from "@/lib/auth/session";
import { ok } from "@/lib/api/http";

export async function POST() {
  await clearSessionCookie();
  return ok({ message: "Logged out." });
}
