import Link from "next/link";
import { SectionShell } from "@/components/layout/section-shell";
import { AuthTerminal } from "@/components/auth/auth-terminal";

const ZONES = [
  { name: "THE GUILD", target: "/about", summary: "About, profile and development philosophy." },
  { name: "THE WORKSHOP", target: "/skills", summary: "Technical capabilities and stack progression." },
  { name: "THE ARCHIVES", target: "/projects", summary: "Case studies and selected work." },
  { name: "THE GAME LAB", target: "/realm/game", summary: "Playable systems (to be expanded in game phase)." },
  { name: "THE BLOCKCHAIN GATE", target: "/realm/profile", summary: "Wallet and Web3 profile integration." },
  { name: "THE QUEST BOARD", target: "/experience", summary: "Services and professional trajectory." },
  { name: "THE COMMUNICATION TERMINAL", target: "/contact", summary: "Direct contact and collaboration channel." },
] as const;

export const metadata = {
  title: "Realm | DS1",
  description: "Mapa conceptual del universo profesional DS1.",
};

export default function RealmPage() {
  return (
    <SectionShell id="realm-page" eyebrow="REALM" title="The Developer's Realm">
      <p className="max-w-3xl text-[var(--color-text-muted)]">
        This hub maps each area of the ecosystem to a concrete section of the platform. Gameplay and progression
        systems will be integrated in dedicated phases, while navigation is already fully operational.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {ZONES.map((zone) => (
          <article key={zone.name} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl text-[var(--color-text)]">{zone.name}</h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">{zone.summary}</p>
            <Link href={zone.target} className="mt-4 inline-flex text-sm text-[var(--color-accent)]">
              Enter Zone
            </Link>
          </article>
        ))}
      </div>

      <div className="mt-8">
        <AuthTerminal />
      </div>
    </SectionShell>
  );
}
