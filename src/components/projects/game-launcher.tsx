"use client";

import { useState } from "react";
import { DeadlandsSurvival } from "@/components/projects/deadlands-survival";
import { Web3Arena } from "@/components/projects/web3-arena";

type GameKey = "sob" | "deadlands" | "coming-soon";

const GAMES: Array<{
  key: GameKey;
  name: string;
  description: string;
  available: boolean;
  statusLabel: string;
}> = [
  {
    key: "sob",
    name: "SoB",
    description: "Survival arena prototype currently available to run.",
    available: true,
    statusLabel: "READY TO RUN",
  },
  {
    key: "deadlands",
    name: "DEADLANDS: SURVIVAL",
    description: "Phase 1 scaffold online with Phaser runtime, modular structure and survival world bootstrap.",
    available: true,
    statusLabel: "PHASE 1 READY",
  },
  {
    key: "coming-soon",
    name: "Next Game",
    description: "Reserved for the next playable project.",
    available: false,
    statusLabel: "COMING SOON",
  },
];

export function GameLauncher() {
  const [selectedGame, setSelectedGame] = useState<GameKey>("sob");

  const activeGame = GAMES.find((game) => game.key === selectedGame) ?? GAMES[0];

  return (
    <div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.14em] text-[var(--color-text-muted)]">GAME RUNNER</p>
          <h2 className="mt-2 font-display text-3xl text-[var(--color-text)]">Choose a game to execute</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            SoB remains playable, and Deadlands now has its Phaser-based foundation module ready for expansion.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-[var(--color-text-soft)]">
          Active game: {activeGame.name}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {GAMES.map((game) => (
          <button
            key={game.key}
            type="button"
            onClick={() => game.available && setSelectedGame(game.key)}
            disabled={!game.available}
            className={[
              "rounded-2xl border p-4 text-left transition-colors",
              selectedGame === game.key
                ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
                : "border-white/10 bg-black/20",
              game.available ? "hover:border-white/25" : "cursor-not-allowed opacity-50",
            ].join(" ")}
          >
            <p className="text-lg text-[var(--color-text)]">{game.name}</p>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">{game.description}</p>
            <p className="mt-3 text-xs tracking-[0.14em] text-[var(--color-text-soft)]">
              {game.statusLabel}
            </p>
          </button>
        ))}
      </div>

      {selectedGame === "sob" ? (
        <Web3Arena />
      ) : selectedGame === "deadlands" ? (
        <DeadlandsSurvival />
      ) : (
        <div className="rounded-3xl border border-dashed border-white/15 bg-black/20 p-6 text-sm text-[var(--color-text-muted)]">
          Select a playable game to load it here.
        </div>
      )}
    </div>
  );
}