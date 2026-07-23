import { ok } from "@/lib/api/http";
import { EXPERIENCES } from "@/constants/portfolio-data";

export async function GET() {
  return ok({ experience: EXPERIENCES });
}
