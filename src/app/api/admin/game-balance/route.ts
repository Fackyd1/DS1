import { requireSession } from "@/lib/auth/session";
import { fromError, ok } from "@/lib/api/http";
import { BUILDING_CONFIG, GATHER_CONFIG, MARKET_RATES, WORKER_CONFIG } from "@/game/data/balance";

export async function GET() {
  try {
    await requireSession(["ADMIN", "EDITOR"]);
    return ok({ gather: GATHER_CONFIG, market: MARKET_RATES, buildings: BUILDING_CONFIG, workers: WORKER_CONFIG });
  } catch (error) {
    return fromError(error);
  }
}
