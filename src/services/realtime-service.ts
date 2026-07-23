type RealmEvent = {
  id: string;
  message: string;
  createdAt: string;
};

const MAX_EVENTS = 100;
const listeners = new Set<(event: RealmEvent) => void>();
const events: RealmEvent[] = [];

export function publishEvent(message: string): RealmEvent {
  const event = {
    id: crypto.randomUUID(),
    message,
    createdAt: new Date().toISOString(),
  };

  events.unshift(event);
  if (events.length > MAX_EVENTS) {
    events.pop();
  }

  listeners.forEach((listener) => listener(event));
  return event;
}

export function subscribeEvents(listener: (event: RealmEvent) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRecentEvents(limit = 20): RealmEvent[] {
  return events.slice(0, limit);
}

export function getOnlinePlayersEstimate(activePlayerCount: number): number {
  return Math.max(1, activePlayerCount);
}

export type { RealmEvent };
