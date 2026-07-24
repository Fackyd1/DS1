import { ok } from "@/lib/api/http";
import { getRealmLeaderboard } from "@/services/realm-backend-service";

export async function GET() {
  const leaderboard = await getRealmLeaderboard();
  return ok({ leaderboard });
}
