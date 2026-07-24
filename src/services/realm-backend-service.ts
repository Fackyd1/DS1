import { ACHIEVEMENTS, BUILDING_CONFIG, QUESTS, WORKER_CONFIG } from "@/game/data/balance";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import {
  buildStructure,
  claimTimedUpgrade,
  gatherResource,
  getLeaderboard,
  getOrCreatePlayer,
  hireWorker,
  sellResource,
} from "@/services/game-service";
import { getRecentEvents } from "@/services/realtime-service";
import type {
  AchievementKey,
  BuildingKey,
  GameActionResult,
  GatherAction,
  PlayerState,
  ResourceKey,
  WorkerKey,
} from "@/types/game";

type RealmEventPayload = {
  id: string;
  message: string;
  createdAt: string;
};

let dbAvailableCache: boolean | null = null;

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

function toInitialState(playerTag: string, userId?: string): PlayerState {
  return getOrCreatePlayer(playerTag, userId);
}

function hydrateInMemoryState(playerTag: string, userId: string | undefined, state: PlayerState): PlayerState {
  const player = getOrCreatePlayer(playerTag, userId);

  player.userId = userId ?? state.userId;
  player.level = state.level;
  player.xp = state.xp;
  player.resources = { ...state.resources };
  player.buildings = state.buildings.map((item) => ({ ...item }));
  player.workers = state.workers.map((item) => ({ ...item }));
  player.achievements = [...state.achievements];
  player.quests = state.quests.map((quest) => ({ ...quest }));
  player.playTimeSeconds = state.playTimeSeconds;
  player.createdAt = state.createdAt;
  player.updatedAt = state.updatedAt;
  player.cooldowns = { ...state.cooldowns };
  player.lastTickAt = state.lastTickAt;

  return player;
}

async function hydrateFromDatabase(playerTag: string, userId?: string): Promise<PlayerState> {
  if (!(await isDbAvailable())) {
    return toInitialState(playerTag, userId);
  }

  try {
    const dbPlayer = await prisma.player.findUnique({
      where: { playerTag },
      include: {
        resources: true,
        buildings: true,
        workers: true,
        quests: { include: { quest: true } },
        achievements: { include: { achievement: true } },
      },
    });

    if (!dbPlayer) {
      return toInitialState(playerTag, userId);
    }

    const resource = dbPlayer.resources[0];
    const questByKey = new Map(dbPlayer.quests.map((entry) => [entry.quest.key, entry]));

    const snapshot: PlayerState = {
      playerTag: dbPlayer.playerTag,
      userId: userId ?? dbPlayer.userId ?? undefined,
      level: dbPlayer.level,
      xp: dbPlayer.xp,
      resources: {
        WOOD: resource?.wood ?? 0,
        STONE: resource?.stone ?? 0,
        IRON: resource?.iron ?? 0,
        GOLD: resource?.gold ?? 0,
      },
      buildings: dbPlayer.buildings.map((building) => ({
        key: building.key as BuildingKey,
        level: building.level,
        quantity: building.quantity,
      })),
      workers: dbPlayer.workers.map((worker) => ({
        key: worker.key as WorkerKey,
        level: worker.level,
        quantity: worker.quantity,
      })),
      achievements: dbPlayer.achievements.map((entry) => entry.achievement.key as AchievementKey),
      quests: QUESTS.map((quest) => {
        const record = questByKey.get(quest.key);
        return {
          key: quest.key,
          progress: record?.progress ?? 0,
          completed: Boolean(record?.completedAt || record?.status === "COMPLETED"),
          completedAt: record?.completedAt?.toISOString(),
        };
      }),
      playTimeSeconds: dbPlayer.playTimeSeconds,
      createdAt: dbPlayer.createdAt.toISOString(),
      updatedAt: dbPlayer.updatedAt.toISOString(),
      cooldowns: {},
      lastTickAt: dbPlayer.lastActionAt.getTime(),
    };

    return hydrateInMemoryState(playerTag, userId, snapshot);
  } catch {
    dbAvailableCache = false;
    return toInitialState(playerTag, userId);
  }
}

function buildingProductionPerMinute(key: BuildingKey): number {
  const config = BUILDING_CONFIG[key];
  return Object.values(config.productionPerMinute).reduce((sum, amount) => sum + amount, 0);
}

function workerSpeedMultiplier(key: WorkerKey): number {
  const config = WORKER_CONFIG[key];
  const boosts = Object.values(config.boosts);
  if (boosts.length === 0) {
    return 1;
  }

  const averageBoost = boosts.reduce((sum, boost) => sum + boost, 0) / boosts.length;
  return 1 + averageBoost / 100;
}

async function persistState(state: PlayerState): Promise<void> {
  if (!(await isDbAvailable())) {
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const quest of QUESTS) {
        await tx.quest.upsert({
          where: { key: quest.key },
          update: {
            title: quest.title,
            description: `${quest.metric} target ${quest.target}`,
            xpReward: quest.xpReward,
            goldReward: quest.goldReward,
            achievement: quest.achievement,
          },
          create: {
            key: quest.key,
            title: quest.title,
            description: `${quest.metric} target ${quest.target}`,
            xpReward: quest.xpReward,
            goldReward: quest.goldReward,
            achievement: quest.achievement,
          },
        });
      }

      for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
        await tx.achievement.upsert({
          where: { key },
          update: {
            title: achievement.title,
            description: achievement.description,
          },
          create: {
            key,
            title: achievement.title,
            description: achievement.description,
          },
        });
      }

      const player = await tx.player.upsert({
        where: { playerTag: state.playerTag },
        update: {
          userId: state.userId,
          level: state.level,
          xp: state.xp,
          playTimeSeconds: state.playTimeSeconds,
          lastActionAt: new Date(state.lastTickAt),
        },
        create: {
          userId: state.userId,
          playerTag: state.playerTag,
          level: state.level,
          xp: state.xp,
          playTimeSeconds: state.playTimeSeconds,
          lastActionAt: new Date(state.lastTickAt),
        },
      });

      await tx.playerResource.upsert({
        where: { playerId: player.id },
        update: {
          wood: state.resources.WOOD,
          stone: state.resources.STONE,
          iron: state.resources.IRON,
          gold: state.resources.GOLD,
        },
        create: {
          playerId: player.id,
          wood: state.resources.WOOD,
          stone: state.resources.STONE,
          iron: state.resources.IRON,
          gold: state.resources.GOLD,
        },
      });

      await tx.building.deleteMany({ where: { playerId: player.id } });
      if (state.buildings.length > 0) {
        await tx.building.createMany({
          data: state.buildings.map((building) => {
            const key = building.key as BuildingKey;
            const config = BUILDING_CONFIG[key];
            return {
              playerId: player.id,
              key,
              name: config.name,
              level: building.level,
              quantity: building.quantity,
              productionPerMin: buildingProductionPerMinute(key),
              buildSeconds: config.buildSeconds,
            };
          }),
        });
      }

      await tx.worker.deleteMany({ where: { playerId: player.id } });
      if (state.workers.length > 0) {
        await tx.worker.createMany({
          data: state.workers.map((worker) => {
            const key = worker.key as WorkerKey;
            const config = WORKER_CONFIG[key];
            return {
              playerId: player.id,
              key,
              name: config.name,
              level: worker.level,
              quantity: worker.quantity,
              speedMultiplier: workerSpeedMultiplier(key),
            };
          }),
        });
      }

      const questRecords = await tx.quest.findMany({
        where: { key: { in: state.quests.map((quest) => quest.key) } },
      });
      const questIdByKey = new Map(questRecords.map((record) => [record.key, record.id]));

      await tx.playerQuest.deleteMany({ where: { playerId: player.id } });
      if (state.quests.length > 0) {
        await tx.playerQuest.createMany({
          data: state.quests
            .map((quest) => {
              const questId = questIdByKey.get(quest.key);
              if (!questId) {
                return null;
              }

              return {
                playerId: player.id,
                questId,
                status: quest.completed ? "COMPLETED" : "IN_PROGRESS",
                progress: quest.progress,
                completedAt: quest.completedAt ? new Date(quest.completedAt) : null,
              };
            })
            .filter((item): item is NonNullable<typeof item> => Boolean(item)),
        });
      }

      const achievementRecords = await tx.achievement.findMany({
        where: { key: { in: state.achievements } },
      });

      await tx.playerAchievement.deleteMany({ where: { playerId: player.id } });
      if (achievementRecords.length > 0) {
        await tx.playerAchievement.createMany({
          data: achievementRecords.map((achievement) => ({
            playerId: player.id,
            achievementId: achievement.id,
          })),
        });
      }
    });
  } catch {
    dbAvailableCache = false;
  }
}

async function persistEvent(playerTag: string, type: string, message: string, meta?: Record<string, unknown>): Promise<void> {
  if (!(await isDbAvailable())) {
    return;
  }

  try {
    const player = await prisma.player.findUnique({ where: { playerTag }, select: { id: true } });
    if (!player) {
      return;
    }

    await prisma.gameEvent.create({
      data: {
        playerId: player.id,
        type,
        message,
        meta: meta ? (meta as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch {
    dbAvailableCache = false;
  }
}

export async function ensureRealmPlayer(playerTag: string, userId?: string): Promise<PlayerState> {
  return hydrateFromDatabase(playerTag, userId);
}

export async function runRealmAction(
  playerTag: string,
  userId: string | undefined,
  actionType: string,
  runner: () => GameActionResult
): Promise<GameActionResult> {
  await hydrateFromDatabase(playerTag, userId);
  const result = runner();
  await persistState(result.player);
  await persistEvent(playerTag, actionType, result.message, {
    level: result.player.level,
    gold: result.player.resources.GOLD,
  });
  return result;
}

export async function getRealmLeaderboard() {
  if (!(await isDbAvailable())) {
    return getLeaderboard();
  }

  try {
    const players = await prisma.player.findMany({
      include: {
        resources: true,
        _count: { select: { achievements: true } },
      },
    });

    return players
      .map((player) => ({
        player: player.playerTag,
        level: player.level,
        gold: player.resources[0]?.gold ?? 0,
        achievements: player._count.achievements,
        time: player.playTimeSeconds,
      }))
      .sort((a, b) => b.gold - a.gold || b.level - a.level || b.achievements - a.achievements)
      .map((entry, index) => ({ rank: index + 1, ...entry }));
  } catch {
    dbAvailableCache = false;
    return getLeaderboard();
  }
}

export async function getRealmEvents(limit = 20): Promise<RealmEventPayload[]> {
  if (!(await isDbAvailable())) {
    return getRecentEvents(limit);
  }

  try {
    const rows = await prisma.gameEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        message: true,
        createdAt: true,
      },
    });

    return rows.map((row) => ({
      id: row.id,
      message: row.message,
      createdAt: row.createdAt.toISOString(),
    }));
  } catch {
    dbAvailableCache = false;
    return getRecentEvents(limit);
  }
}

export async function runGatherAction(playerTag: string, userId: string | undefined, action: GatherAction) {
  return runRealmAction(playerTag, userId, "GATHER", () => gatherResource(playerTag, action));
}

export async function runBuildAction(playerTag: string, userId: string | undefined, building: BuildingKey) {
  return runRealmAction(playerTag, userId, "BUILD", () => buildStructure(playerTag, building));
}

export async function runHireAction(playerTag: string, userId: string | undefined, worker: WorkerKey) {
  return runRealmAction(playerTag, userId, "HIRE", () => hireWorker(playerTag, worker));
}

export async function runSellAction(
  playerTag: string,
  userId: string | undefined,
  resource: Exclude<ResourceKey, "GOLD">,
  amount: number
) {
  return runRealmAction(playerTag, userId, "SELL", () => sellResource(playerTag, resource, amount));
}

export async function runTimedUpgradeAction(playerTag: string, userId: string | undefined) {
  return runRealmAction(playerTag, userId, "TIMED_UPGRADE", () => claimTimedUpgrade(playerTag));
}

type DepositIntentMeta = {
  intentId: string;
  amount: number;
  paymentMethod: string;
  network: "SOLANA";
  asset: "USDT";
  receiverWallet: string;
  playerTag: string;
  provider: string;
};

type DepositVerificationMeta = {
  intentId: string;
  status: string;
  transactionId?: string;
  provider: string;
  providerPayload?: Record<string, unknown>;
};

export async function createRealmDepositIntent(
  playerTag: string,
  meta: Omit<DepositIntentMeta, "intentId">
): Promise<{ intentId: string }> {
  const intentId = `dep_${crypto.randomUUID()}`;

  await persistEvent(
    playerTag,
    "DEPOSIT_INTENT",
    `Deposit intent ${meta.amount.toFixed(2)} ${meta.asset} via ${meta.network} (${meta.paymentMethod})`,
    {
      ...meta,
      intentId,
      status: "PENDING",
    }
  );

  return { intentId };
}

export async function markRealmDepositVerified(playerTag: string, meta: DepositVerificationMeta): Promise<void> {
  await persistEvent(
    playerTag,
    "DEPOSIT_VERIFIED",
    `Deposit ${meta.intentId} marked as ${meta.status}${meta.transactionId ? ` (tx: ${meta.transactionId})` : ""}`,
    {
      ...meta,
      verifiedAt: new Date().toISOString(),
    }
  );
}

type DepositStatusResult = {
  status: "PENDING" | "CONFIRMED" | "DENIED" | "FAILED" | "NOT_FOUND";
  intentId: string;
  transactionId?: string;
};

export async function getRealmDepositStatus(playerTag: string, intentId: string): Promise<DepositStatusResult> {
  if (!(await isDbAvailable())) {
    return {
      status: "NOT_FOUND",
      intentId,
    };
  }

  try {
    const events = await prisma.gameEvent.findMany({
      where: {
        player: { playerTag },
        type: { in: ["DEPOSIT_INTENT", "DEPOSIT_VERIFIED"] },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        meta: true,
        type: true,
      },
    });

    for (const event of events) {
      const meta = (event.meta as Record<string, unknown> | null) || null;
      if (!meta || meta.intentId !== intentId) {
        continue;
      }

      if (event.type === "DEPOSIT_VERIFIED") {
        const normalized = String(meta.status || "PENDING").toUpperCase();
        const status =
          normalized === "CONFIRMED"
            ? "CONFIRMED"
            : normalized === "DENIED"
              ? "DENIED"
              : normalized === "FAILED"
                ? "FAILED"
                : "PENDING";
        const transactionId = typeof meta.transactionId === "string" ? meta.transactionId : undefined;
        return {
          status,
          intentId,
          transactionId,
        };
      }

      if (event.type === "DEPOSIT_INTENT") {
        return {
          status: "PENDING",
          intentId,
        };
      }
    }

    return {
      status: "NOT_FOUND",
      intentId,
    };
  } catch {
    dbAvailableCache = false;
    return {
      status: "NOT_FOUND",
      intentId,
    };
  }
}