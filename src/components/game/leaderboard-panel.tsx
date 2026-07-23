"use client";

import { useEffect, useState } from "react";

type LeaderboardEntry = {
  rank: number;
  player: string;
  level: number;
  gold: number;
  achievements: number;
  time: number;
};

type RealmEvent = {
  id: string;
  message: string;
  createdAt: string;
};

export function LeaderboardPanel() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [events, setEvents] = useState<RealmEvent[]>([]);

  useEffect(() => {
    fetch("/api/leaderboard", { cache: "no-store" })
      .then((response) => response.json())
      .then((body: { leaderboard: LeaderboardEntry[] }) => setEntries(body.leaderboard));

    fetch("/api/game/events", { cache: "no-store" })
      .then((response) => response.text())
      .then((raw) => {
        const match = raw.match(/data:\s*(.*)/);
        if (!match?.[1]) return;
        const parsed = JSON.parse(match[1]) as { events: RealmEvent[] };
        setEvents(parsed.events || []);
      });
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-2xl text-[var(--color-text)]">Leaderboard</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[var(--color-text-muted)]">
              <tr>
                <th className="py-2">RANK</th>
                <th className="py-2">PLAYER</th>
                <th className="py-2">LEVEL</th>
                <th className="py-2">GOLD</th>
                <th className="py-2">ACHIEVEMENTS</th>
                <th className="py-2">TIME</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={`${entry.player}-${entry.rank}`} className="border-t border-white/10">
                  <td className="py-2">{entry.rank}</td>
                  <td className="py-2">{entry.player}</td>
                  <td className="py-2">{entry.level}</td>
                  <td className="py-2">{entry.gold}</td>
                  <td className="py-2">{entry.achievements}</td>
                  <td className="py-2">{entry.time}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-2xl text-[var(--color-text)]">Recent Realm Events</h2>
        <ul className="mt-4 space-y-3 text-sm text-[var(--color-text-muted)]">
          {events.length === 0 ? <li>No recent events.</li> : null}
          {events.map((event) => (
            <li key={event.id}>{event.message}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
