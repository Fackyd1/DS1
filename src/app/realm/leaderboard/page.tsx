import { SectionShell } from "@/components/layout/section-shell";
import { LeaderboardPanel } from "@/components/game/leaderboard-panel";

export const metadata = {
  title: "Realm Leaderboard | DS1",
  description: "Ranking de progreso del Realm.",
};

export default function RealmLeaderboardPage() {
  return (
    <SectionShell id="realm-leaderboard-page" eyebrow="LEADERBOARD" title="Hall of Builders">
      <LeaderboardPanel />
    </SectionShell>
  );
}
