import { ok } from "@/lib/api/http";
import { SKILLS } from "@/constants/portfolio-data";

export async function GET() {
  return ok({ skills: SKILLS });
}
