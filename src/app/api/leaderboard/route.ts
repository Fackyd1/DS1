import { ok } from "@/lib/api/http";
import { getLeaderboard } from "@/services/game-service";

export async function GET() {
  const leaderboard = getLeaderboard();
  return ok({ leaderboard });
}
