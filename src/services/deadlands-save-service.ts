import { prisma } from "@/lib/db/prisma";
import { createInitialDeadlandsSnapshot } from "@/features/deadlands/data/content";
import type {
  DeadlandsInventoryItem,
  DeadlandsMode,
  DeadlandsQuestSnapshot,
  DeadlandsSurvivalSnapshot,
} from "@/features/deadlands/types/game";

let dbAvailableCache: boolean | null = null;

function toObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function toNumber(value: unknown, fallback: number, min?: number, max?: number) {
  const next = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  const clampedMin = min ?? Number.NEGATIVE_INFINITY;
  const clampedMax = max ?? Number.POSITIVE_INFINITY;
  return Math.max(clampedMin, Math.min(clampedMax, next));
}

function toStringValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function toStringList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function normalizeInventory(value: unknown, fallback: DeadlandsInventoryItem[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value
    .map((entry) => {
      const item = toObject(entry);
      const id = toStringValue(item.id, "");
      if (!id) {
        return null;
      }

      return {
        id,
        name: toStringValue(item.name, id),
        description: toStringValue(item.description, "Recovered item."),
        type: toStringValue(item.type, "MATERIAL") as DeadlandsInventoryItem["type"],
        rarity: toStringValue(item.rarity, "COMMON") as DeadlandsInventoryItem["rarity"],
        quantity: toNumber(item.quantity, 1, 0, 999),
        maxStack: toNumber(item.maxStack, 1, 1, 999),
        weight: toNumber(item.weight, 0.1, 0, 99),
        durability: typeof item.durability === "number" ? toNumber(item.durability, item.durability, 0, 1000) : undefined,
        value: toNumber(item.value, 0, 0, 999999),
      } satisfies DeadlandsInventoryItem;
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
}

function normalizeQuests(value: unknown, fallback: DeadlandsQuestSnapshot[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value
    .map((entry) => {
      const quest = toObject(entry);
      const key = toStringValue(quest.key, "");
      if (!key) {
        return null;
      }

      return {
        key,
        title: toStringValue(quest.title, key),
        description: toStringValue(quest.description, ""),
        progress: toNumber(quest.progress, 0, 0, 999999),
        target: toNumber(quest.target, 1, 1, 999999),
        completed: Boolean(quest.completed),
        rewardText: toStringValue(quest.rewardText, ""),
      } satisfies DeadlandsQuestSnapshot;
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
}

function normalizeSnapshot(candidate: unknown): DeadlandsSurvivalSnapshot {
  const source = toObject(candidate);
  const mode = toStringValue(source.mode, "NORMAL") as DeadlandsMode;
  const base = createInitialDeadlandsSnapshot(mode);
  const ammoSource = toObject(source.ammoReserve);

  return {
    ...base,
    health: toNumber(source.health, base.health, 0, 999),
    maxHealth: toNumber(source.maxHealth, base.maxHealth, 1, 999),
    stamina: toNumber(source.stamina, base.stamina, 0, 999),
    maxStamina: toNumber(source.maxStamina, base.maxStamina, 1, 999),
    hunger: toNumber(source.hunger, base.hunger, 0, 100),
    thirst: toNumber(source.thirst, base.thirst, 0, 100),
    temperature: toNumber(source.temperature, base.temperature, -50, 100),
    level: toNumber(source.level, base.level, 1, 999),
    xp: toNumber(source.xp, base.xp, 0, 999999),
    skillPoints: toNumber(source.skillPoints, base.skillPoints, 0, 999),
    survivalDays: toNumber(source.survivalDays, base.survivalDays, 1, 999999),
    kills: toNumber(source.kills, base.kills, 0, 999999),
    deaths: toNumber(source.deaths, base.deaths, 0, 999999),
    distanceTraveled: toNumber(source.distanceTraveled, base.distanceTraveled, 0, 99999999),
    currency: toNumber(source.currency, base.currency, 0, 99999999),
    shelterLevel: toNumber(source.shelterLevel, base.shelterLevel, 1, 99),
    zone: toStringValue(source.zone, base.zone) as DeadlandsSurvivalSnapshot["zone"],
    mapPoint: toStringValue(source.mapPoint, base.mapPoint) as DeadlandsSurvivalSnapshot["mapPoint"],
    dayPhase: toStringValue(source.dayPhase, base.dayPhase) as DeadlandsSurvivalSnapshot["dayPhase"],
    dayClock: toNumber(source.dayClock, base.dayClock, 0, 99999999),
    mode,
    eventLabel: toStringValue(source.eventLabel, base.eventLabel),
    gameOver: Boolean(source.gameOver),
    currentWeaponId: toStringValue(source.currentWeaponId, base.currentWeaponId),
    ammoReserve: {
      LIGHT_AMMO: toNumber(ammoSource.LIGHT_AMMO, base.ammoReserve.LIGHT_AMMO, 0, 999999),
      HEAVY_AMMO: toNumber(ammoSource.HEAVY_AMMO, base.ammoReserve.HEAVY_AMMO, 0, 999999),
      SHOTGUN_SHELLS: toNumber(ammoSource.SHOTGUN_SHELLS, base.ammoReserve.SHOTGUN_SHELLS, 0, 999999),
      SPECIAL_AMMO: toNumber(ammoSource.SPECIAL_AMMO, base.ammoReserve.SPECIAL_AMMO, 0, 999999),
    },
    inventory: normalizeInventory(source.inventory, base.inventory),
    quests: normalizeQuests(source.quests, base.quests),
    notifications: toStringList(source.notifications, base.notifications).slice(0, 12),
    achievements: toStringList(source.achievements, base.achievements),
    desktopRecommended: source.desktopRecommended === undefined ? base.desktopRecommended : Boolean(source.desktopRecommended),
    activeZombieCount: toNumber(source.activeZombieCount, base.activeZombieCount, 0, 9999),
    shelterBarricades: toNumber(source.shelterBarricades, base.shelterBarricades, 0, 999),
  };
}

async function isDbAvailable(): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    return false;
  }

  if (dbAvailableCache !== null) {
    return dbAvailableCache;
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbAvailableCache = true;
    return true;
  } catch {
    dbAvailableCache = false;
    return false;
  }
}

async function ensurePlayerRecord(playerTag: string, userId?: string) {
  return prisma.player.upsert({
    where: { playerTag },
    update: {
      userId,
      lastActionAt: new Date(),
    },
    create: {
      playerTag,
      userId,
      lastActionAt: new Date(),
    },
  });
}

export async function loadDeadlandsSnapshot(playerTag: string, userId?: string): Promise<DeadlandsSurvivalSnapshot> {
  const fallback = createInitialDeadlandsSnapshot();
  if (!(await isDbAvailable())) {
    return fallback;
  }

  try {
    await ensurePlayerRecord(playerTag, userId);
    const latestSave = await prisma.gameEvent.findFirst({
      where: {
        player: { playerTag },
        type: "DEADLANDS_SAVE",
      },
      orderBy: { createdAt: "desc" },
      select: { meta: true },
    });

    if (!latestSave?.meta) {
      return fallback;
    }

    const meta = toObject(latestSave.meta);
    return normalizeSnapshot(meta.snapshot);
  } catch {
    dbAvailableCache = false;
    return fallback;
  }
}

export async function saveDeadlandsSnapshot(
  playerTag: string,
  userId: string | undefined,
  candidate: unknown
): Promise<DeadlandsSurvivalSnapshot> {
  const snapshot = normalizeSnapshot(candidate);
  if (!(await isDbAvailable())) {
    return snapshot;
  }

  try {
    const player = await ensurePlayerRecord(playerTag, userId);
    await prisma.gameEvent.create({
      data: {
        playerId: player.id,
        type: "DEADLANDS_SAVE",
        message: `Deadlands autosave · Day ${snapshot.survivalDays} · Level ${snapshot.level}`,
        meta: {
          snapshot,
          summary: {
            mode: snapshot.mode,
            level: snapshot.level,
            survivalDays: snapshot.survivalDays,
            kills: snapshot.kills,
            zone: snapshot.zone,
            mapPoint: snapshot.mapPoint,
          },
        },
      },
    });

    return snapshot;
  } catch {
    dbAvailableCache = false;
    return snapshot;
  }
}
