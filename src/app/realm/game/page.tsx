import { SectionShell } from "@/components/layout/section-shell";
import { RealmConsole } from "@/components/game/realm-console";

export const metadata = {
  title: "Realm Game | DS1",
  description: "Entrada al mini juego The Last Builder.",
};

export default function RealmGamePage() {
  return (
    <SectionShell id="realm-game-page" eyebrow="GAME LAB" title="The Last Builder">
      <RealmConsole />
    </SectionShell>
  );
}
