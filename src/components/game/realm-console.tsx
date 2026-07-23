"use client";

import { useEffect, useMemo, useState } from "react";

type ResourceState = {
  WOOD: number;
  STONE: number;
  IRON: number;
  GOLD: number;
};

type PlayerData = {
  playerTag: string;
  level: number;
  xp: number;
  resources: ResourceState;
  achievements: string[];
  quests: Array<{ key: string; progress: number; completed: boolean }>;
  buildings: Array<{ key: string; level: number; quantity: number }>;
  workers: Array<{ key: string; level: number; quantity: number }>;
};

const BUILDINGS = ["WORKBENCH", "LUMBER_CAMP", "STONE_QUARRY", "IRON_MINE", "BLACKSMITH", "MARKET"] as const;
const WORKERS = ["LUMBERJACK", "MINER", "BLACKSMITH", "BUILDER"] as const;
const GATHER = ["WOOD", "STONE", "IRON"] as const;

export function RealmConsole() {
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [status, setStatus] = useState("Loading player profile...");
  const [busy, setBusy] = useState(false);

  async function hydratePlayer() {
    const response = await fetch("/api/player", { cache: "no-store" });
    const body = (await response.json()) as { player: PlayerData };
    setPlayer(body.player);
  }

  useEffect(() => {
    hydratePlayer()
      .then(() => setStatus("Realm synced."))
      .catch(() => setStatus("Unable to load player data."));
  }, []);

  async function runAction(endpoint: string, payload: Record<string, unknown>) {
    setBusy(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = (await response.json()) as { message?: string; player?: PlayerData };
      if (!response.ok) {
        setStatus(body.message || "Action failed.");
        return;
      }

      if (body.player) {
        setPlayer(body.player);
      }

      setStatus(body.message || "Action completed.");
    } catch {
      setStatus("Action failed due to network error.");
    } finally {
      setBusy(false);
    }
  }

  const completed = useMemo(() => (player?.resources.GOLD ?? 0) >= 10_000, [player?.resources.GOLD]);

  if (!player) {
    return <p className="text-sm text-[var(--color-text-muted)]">{status}</p>;
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-2xl text-[var(--color-text)]">THE LAST BUILDER</h2>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">Player: {player.playerTag}</p>
        <p className="text-sm text-[var(--color-text-muted)]">Level {player.level} · XP {player.xp}</p>
        <p className="mt-2 text-sm text-[var(--color-accent)]">{status}</p>
        {completed ? (
          <div className="mt-4 rounded-xl border border-[var(--color-accent)]/60 bg-[var(--color-accent)]/10 p-4">
            <p className="font-semibold text-[var(--color-text)]">REALM COMPLETED</p>
            <p className="text-sm text-[var(--color-text-muted)]">THE BUILDER HAS ASCENDED</p>
          </div>
        ) : null}
      </header>

      <section className="grid gap-3 md:grid-cols-4">
        {Object.entries(player.resources).map(([key, value]) => (
          <article key={key} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-[var(--color-text-muted)]">{key}</p>
            <p className="text-2xl text-[var(--color-text)]">{value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-xl text-[var(--color-text)]">Gather</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          {GATHER.map((resource) => (
            <button
              key={resource}
              disabled={busy}
              onClick={() => runAction("/api/game/gather", { action: resource })}
              className="rounded-full border border-white/20 px-4 py-2 text-sm disabled:opacity-50"
            >
              Gather {resource}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-xl text-[var(--color-text)]">Build</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          {BUILDINGS.map((building) => (
            <button
              key={building}
              disabled={busy}
              onClick={() => runAction("/api/game/build", { building })}
              className="rounded-full border border-white/20 px-4 py-2 text-sm disabled:opacity-50"
            >
              Build {building}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-xl text-[var(--color-text)]">Hire</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          {WORKERS.map((worker) => (
            <button
              key={worker}
              disabled={busy}
              onClick={() => runAction("/api/game/hire", { worker })}
              className="rounded-full border border-white/20 px-4 py-2 text-sm disabled:opacity-50"
            >
              Hire {worker}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-xl text-[var(--color-text)]">Market</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            disabled={busy}
            onClick={() => runAction("/api/game/sell", { resource: "WOOD", amount: 100 })}
            className="rounded-full border border-white/20 px-4 py-2 text-sm disabled:opacity-50"
          >
            Sell 100 WOOD
          </button>
          <button
            disabled={busy}
            onClick={() => runAction("/api/game/sell", { resource: "STONE", amount: 100 })}
            className="rounded-full border border-white/20 px-4 py-2 text-sm disabled:opacity-50"
          >
            Sell 100 STONE
          </button>
          <button
            disabled={busy}
            onClick={() => runAction("/api/game/sell", { resource: "IRON", amount: 100 })}
            className="rounded-full border border-white/20 px-4 py-2 text-sm disabled:opacity-50"
          >
            Sell 100 IRON
          </button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-xl text-[var(--color-text)]">Quests</h3>
          <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-muted)]">
            {player.quests.map((quest) => (
              <li key={quest.key}>
                {quest.completed ? "[DONE]" : "[TODO]"} {quest.key} ({quest.progress})
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-xl text-[var(--color-text)]">Achievements</h3>
          <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-muted)]">
            {player.achievements.length === 0 ? <li>No achievements yet.</li> : null}
            {player.achievements.map((achievement) => (
              <li key={achievement}>{achievement}</li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
