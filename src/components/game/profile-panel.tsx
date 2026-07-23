"use client";

import { useEffect, useState } from "react";

type PlayerState = {
  playerTag: string;
  level: number;
  xp: number;
  resources: {
    WOOD: number;
    STONE: number;
    IRON: number;
    GOLD: number;
  };
  buildings: Array<{ key: string; level: number; quantity: number }>;
  workers: Array<{ key: string; level: number; quantity: number }>;
  achievements: string[];
  playTimeSeconds: number;
};

export function ProfilePanel() {
  const [player, setPlayer] = useState<PlayerState | null>(null);

  useEffect(() => {
    fetch("/api/player", { cache: "no-store" })
      .then((response) => response.json())
      .then((body: { player: PlayerState }) => setPlayer(body.player));
  }, []);

  if (!player) {
    return <p className="text-sm text-[var(--color-text-muted)]">Loading profile...</p>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-2xl text-[var(--color-text)]">PLAYER PROFILE</h2>
        <ul className="mt-4 space-y-2 text-sm text-[var(--color-text-muted)]">
          <li>PLAYER ID: {player.playerTag}</li>
          <li>LEVEL: {player.level}</li>
          <li>XP: {player.xp}</li>
          <li>GOLD: {player.resources.GOLD}</li>
          <li>WOOD: {player.resources.WOOD}</li>
          <li>STONE: {player.resources.STONE}</li>
          <li>IRON: {player.resources.IRON}</li>
          <li>PLAY TIME: {player.playTimeSeconds}s</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-xl text-[var(--color-text)]">Progress</h3>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">Buildings: {player.buildings.length}</p>
        <p className="text-sm text-[var(--color-text-muted)]">Workers: {player.workers.length}</p>
        <p className="text-sm text-[var(--color-text-muted)]">Achievements: {player.achievements.length}</p>
      </section>
    </div>
  );
}
