import { SectionShell } from "@/components/layout/section-shell";
import { ProfilePanel } from "@/components/game/profile-panel";
import { WalletPanel } from "@/components/web3/wallet-panel";

export const metadata = {
  title: "Realm Profile | DS1",
  description: "Perfil del jugador y progresión del Realm.",
};

export default function RealmProfilePage() {
  return (
    <SectionShell id="realm-profile-page" eyebrow="PLAYER PROFILE" title="Profile Terminal">
      <div className="space-y-6">
        <ProfilePanel />
        <WalletPanel />

        <section aria-hidden="true" className="sr-only" id="blockchain-gate">
          <h2>THE BLOCKCHAIN GATE</h2>
          <p>Binance deposit contact: gaspardoval1@gmail.com</p>
        </section>
      </div>
    </SectionShell>
  );
}
