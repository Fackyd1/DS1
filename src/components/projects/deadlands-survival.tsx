"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEADLANDS_MAP_POINTS,
  DEADLANDS_PHASE,
  DEADLANDS_PHASE_ONE_FEATURES,
  DEADLANDS_WORLD_ZONES,
} from "@/features/deadlands/config/game-config";
import { createDeadlandsGame } from "@/features/deadlands/engine/create-deadlands-game";
import { deadlandsPhaseSummary, useDeadlandsStore } from "@/features/deadlands/state/deadlands-store";

function Meter({ label, value, max, tone }: { label: string; value: number; max: number; tone: string }) {
  const width = `${Math.max(0, Math.min(100, (value / max) * 100))}%`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs tracking-[0.08em] text-[var(--color-text-soft)]">
        <span>{label}</span>
        <span>{Math.round(value)}/{Math.round(max)}</span>
      </div>
      <div className="h-2 rounded-full bg-white/8">
        <div className="h-full rounded-full transition-all duration-200" style={{ width, background: tone }} />
      </div>
    </div>
  );
}

function SurfaceCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={["rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-sm", className].join(" ")}>
      <p className="text-xs tracking-[0.14em] text-[#9fb2bf]">{title}</p>
      {children}
    </div>
  );
}

export function DeadlandsSurvival() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const runtimeStatus = useDeadlandsStore((state) => state.runtimeStatus);
  const activeZone = useDeadlandsStore((state) => state.activeZone);
  const highlightedPoint = useDeadlandsStore((state) => state.highlightedPoint);
  const snapshot = useDeadlandsStore((state) => state.snapshot);
  const setRuntimeStatus = useDeadlandsStore((state) => state.setRuntimeStatus);
  const enqueueCommand = useDeadlandsStore((state) => state.enqueueCommand);
  const hydrateSnapshot = useDeadlandsStore((state) => state.hydrateSnapshot);
  const latestSnapshotRef = useRef(snapshot);
  const lastSavedRef = useRef("");
  const [saveStatus, setSaveStatus] = useState("Loading save...");
  const [sessionTag, setSessionTag] = useState<string | null>(null);

  useEffect(() => {
    latestSnapshotRef.current = snapshot;
  }, [snapshot]);

  const persistSnapshot = useCallback(async (showSavedLabel = false) => {
    if (!sessionTag) {
      return;
    }

    const serialized = JSON.stringify(latestSnapshotRef.current);
    if (!showSavedLabel && serialized === lastSavedRef.current) {
      return;
    }

    setSaveStatus("Saving...");

    try {
      const response = await fetch("/api/game/deadlands/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot: latestSnapshotRef.current }),
      });

      if (!response.ok) {
        setSaveStatus("Save failed");
        return;
      }

      lastSavedRef.current = serialized;
      setSaveStatus(showSavedLabel ? "Saved now" : "Autosaved");
    } catch {
      setSaveStatus("Save failed");
    }
  }, [sessionTag]);

  useEffect(() => {
    if (!hostRef.current) {
      return;
    }

    let mounted = true;
    let currentGame: Awaited<ReturnType<typeof createDeadlandsGame>> | null = null;

    setRuntimeStatus("booting");

    void (async () => {
      try {
        const saveResponse = await fetch("/api/game/deadlands/state", { cache: "no-store" });
        if (saveResponse.ok) {
          const body = (await saveResponse.json()) as {
            snapshot?: typeof snapshot;
            session?: { playerTag?: string };
          };

          if (body.snapshot) {
            hydrateSnapshot(body.snapshot);
            lastSavedRef.current = JSON.stringify(body.snapshot);
          }

          if (body.session?.playerTag) {
            setSessionTag(body.session.playerTag);
          }

          setSaveStatus("Save loaded");
        } else {
          setSaveStatus("Using runtime snapshot");
        }
      } catch {
        setSaveStatus("Using runtime snapshot");
      }

      try {
        const game = await createDeadlandsGame(hostRef.current as HTMLDivElement);
        if (!mounted) {
          game.destroy(true);
          return;
        }

        currentGame = game;
        setRuntimeStatus("ready");
      } catch {
        if (mounted) {
          setRuntimeStatus("stopped");
          setSaveStatus("Runtime failed");
        }
      }
    })();

    return () => {
      mounted = false;
      currentGame?.destroy(true);
      setRuntimeStatus("stopped");
    };
  }, [hydrateSnapshot, setRuntimeStatus]);

  useEffect(() => {
    if (runtimeStatus !== "ready" || !sessionTag) {
      return;
    }

    const timer = window.setInterval(() => {
      void persistSnapshot(false);
    }, 8000);

    return () => {
      window.clearInterval(timer);
    };
  }, [persistSnapshot, runtimeStatus, sessionTag]);

  const missionsModePanel = (
    <SurfaceCard title="MISSIONS · MODE">
      <div className="mt-3 space-y-2 text-sm text-[var(--color-text-soft)]">
        {snapshot.quests.map((quest) => (
          <div key={quest.key} className="rounded-2xl border border-white/8 bg-black/20 p-3">
            <p className="text-[var(--color-text)]">{quest.title}</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">{quest.description}</p>
            <p className="mt-2 text-xs text-[var(--color-text-soft)]">
              {quest.progress}/{quest.target} · {quest.completed ? "COMPLETE" : quest.rewardText}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(["NORMAL", "HARD", "SURVIVAL"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => enqueueCommand("CHANGE_MODE", mode)}
            className={[
              "rounded-full border px-3 py-2 text-xs",
              snapshot.mode === mode
                ? "border-[#d16d5b]/60 bg-[#d16d5b]/10 text-[var(--color-text)]"
                : "border-white/10 text-[var(--color-text-muted)]",
            ].join(" ")}
          >
            {mode}
          </button>
        ))}
        <button
          type="button"
          onClick={() => enqueueCommand("RESTART")}
          className="rounded-full border border-white/10 px-3 py-2 text-xs text-[var(--color-text-soft)]"
        >
          Respawn
        </button>
        <button
          type="button"
          onClick={() => void persistSnapshot(true)}
          className="rounded-full border border-[#4eb1a8]/40 px-3 py-2 text-xs text-[var(--color-text)]"
        >
          Save Now
        </button>
      </div>
    </SurfaceCard>
  );

  const loadoutInventoryPanel = (
    <SurfaceCard title="LOADOUT · INVENTORY">
      <p className="mt-3 text-sm text-[var(--color-text)]">Weapon: {snapshot.currentWeaponId}</p>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">Light ammo reserve: {snapshot.ammoReserve.LIGHT_AMMO}</p>
      <div className="mt-3 space-y-2 text-sm text-[var(--color-text-soft)]">
        {snapshot.inventory.slice(0, 8).map((item) => (
          <div key={`${item.id}-${item.quantity}`} className="flex items-center justify-between rounded-xl border border-white/8 px-3 py-2">
            <span>{item.name}</span>
            <span>x{item.quantity}</span>
          </div>
        ))}
      </div>
    </SurfaceCard>
  );

  return (
    <section className="space-y-6 rounded-3xl border border-[#4eb1a8]/20 bg-[linear-gradient(160deg,rgba(9,12,16,0.98),rgba(18,25,31,0.96))] p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.16em] text-[#9fb2bf]">SURVIVAL PVE MODULE</p>
          <h2 className="mt-2 font-display text-4xl text-[var(--color-text)]">DEADLANDS: SURVIVAL</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--color-text-muted)]">{deadlandsPhaseSummary}</p>
          <p className="mt-3 text-xs tracking-[0.1em] text-[var(--color-text-soft)]">Save state: {saveStatus}{sessionTag ? ` · ${sessionTag}` : ""}</p>
        </div>
        <div className="rounded-2xl border border-[#d16d5b]/30 bg-black/20 px-4 py-3 text-sm text-[var(--color-text-soft)]">
          {DEADLANDS_PHASE.current} · {runtimeStatus.toUpperCase()} · {snapshot.mode}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/30 p-2">
          <div ref={hostRef} className="aspect-video min-h-[280px] w-full rounded-[1.35rem] bg-[#090c10]" />

          <div className="pointer-events-none absolute inset-x-5 top-5 z-20 hidden xl:flex xl:items-start xl:justify-between xl:gap-4">
            <div className="pointer-events-auto w-full max-w-[360px]">{missionsModePanel}</div>
            <div className="pointer-events-auto w-full max-w-[300px]">{loadoutInventoryPanel}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs tracking-[0.14em] text-[#9fb2bf]">SURVIVAL HUD</p>
            <div className="mt-3 space-y-3">
              <Meter label="HEALTH" value={snapshot.health} max={snapshot.maxHealth} tone="linear-gradient(90deg,#d16d5b,#ff8e7b)" />
              <Meter label="STAMINA" value={snapshot.stamina} max={snapshot.maxStamina} tone="linear-gradient(90deg,#4eb1a8,#7fd6cb)" />
              <Meter label="HUNGER" value={snapshot.hunger} max={100} tone="linear-gradient(90deg,#c08b3e,#f1c38c)" />
              <Meter label="THIRST" value={snapshot.thirst} max={100} tone="linear-gradient(90deg,#527ea7,#7eb3de)" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-[var(--color-text-soft)]">
              <p>Day: {snapshot.survivalDays}</p>
              <p>Phase: {snapshot.dayPhase}</p>
              <p>Level: {snapshot.level}</p>
              <p>XP: {snapshot.xp}</p>
              <p>Kills: {snapshot.kills}</p>
              <p>Credits: {snapshot.currency}</p>
              <p>Zombies: {snapshot.activeZombieCount}</p>
              <p>Temp: {snapshot.temperature.toFixed(1)} C</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs tracking-[0.14em] text-[#9fb2bf]">WORLD ZONES</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {DEADLANDS_WORLD_ZONES.map((zone) => (
                <button
                  key={zone}
                  type="button"
                  onClick={() => enqueueCommand("TRAVEL_ZONE", zone)}
                  className={[
                    "rounded-full border px-3 py-2 text-xs tracking-[0.08em] transition-colors",
                    activeZone === zone ? "border-[#4eb1a8]/70 bg-[#4eb1a8]/10 text-[var(--color-text)]" : "border-white/10 text-[var(--color-text-muted)] hover:border-white/20",
                  ].join(" ")}
                >
                  {zone}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs tracking-[0.14em] text-[#9fb2bf]">MAP SEED</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {DEADLANDS_MAP_POINTS.map((point) => (
                <button
                  key={point}
                  type="button"
                  onClick={() => enqueueCommand("TRAVEL_POINT", point)}
                  className={[
                    "rounded-2xl border px-3 py-3 text-left text-sm transition-colors",
                    highlightedPoint === point ? "border-[#d16d5b]/60 bg-[#d16d5b]/10 text-[var(--color-text)]" : "border-white/10 text-[var(--color-text-muted)] hover:border-white/20",
                  ].join(" ")}
                >
                  {point}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs tracking-[0.14em] text-[#9fb2bf]">CRAFTING · BUILD</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => enqueueCommand("CRAFT_BANDAGE")} className="rounded-full border border-white/10 px-3 py-2 text-xs text-[var(--color-text-soft)]">Craft Bandage</button>
              <button type="button" onClick={() => enqueueCommand("CRAFT_WATER")} className="rounded-full border border-white/10 px-3 py-2 text-xs text-[var(--color-text-soft)]">Purify Water</button>
              <button type="button" onClick={() => enqueueCommand("CRAFT_LIGHT_AMMO")} className="rounded-full border border-white/10 px-3 py-2 text-xs text-[var(--color-text-soft)]">Craft Ammo</button>
              <button type="button" onClick={() => enqueueCommand("BUILD_BARRICADE")} className="rounded-full border border-[#4eb1a8]/40 px-3 py-2 text-xs text-[var(--color-text)]">Build Barricade</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => enqueueCommand("USE_BANDAGE")} className="rounded-full border border-white/10 px-3 py-2 text-xs text-[var(--color-text-soft)]">Use Bandage</button>
              <button type="button" onClick={() => enqueueCommand("USE_WATER")} className="rounded-full border border-white/10 px-3 py-2 text-xs text-[var(--color-text-soft)]">Drink Water</button>
              <button type="button" onClick={() => enqueueCommand("USE_FOOD")} className="rounded-full border border-white/10 px-3 py-2 text-xs text-[var(--color-text-soft)]">Eat Food</button>
            </div>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">Shelter level {snapshot.shelterLevel} · Barricades {snapshot.shelterBarricades}</p>
          </div>

          <div className="xl:hidden">{missionsModePanel}</div>

          <div className="xl:hidden">{loadoutInventoryPanel}</div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs tracking-[0.14em] text-[#9fb2bf]">EVENTS · CONTROLS</p>
            <p className="mt-3 text-sm text-[var(--color-text)]">{snapshot.eventLabel}</p>
            <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-soft)]">
              {snapshot.notifications.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-[var(--color-text-muted)]">WASD or arrows move · Shift sprint · Click shoot · Space melee · R reload · E scavenge</p>
            {snapshot.gameOver ? <p className="mt-3 text-sm text-[#ff8e7b]">YOU DIED · Days {snapshot.survivalDays} · Kills {snapshot.kills} · Distance {snapshot.distanceTraveled.toFixed(0)}</p> : null}
            {snapshot.desktopRecommended ? <p className="mt-2 text-xs text-[var(--color-text-muted)]">Desktop recommended.</p> : null}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs tracking-[0.14em] text-[#9fb2bf]">FEATURE COVERAGE</p>
            <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-soft)]">
              {DEADLANDS_PHASE_ONE_FEATURES.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
