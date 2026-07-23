import type {
  AchievementKey,
  BuildingKey,
  GatherAction,
  QuestKey,
  ResourceKey,
  WorkerKey,
} from "@/types/game";

export const LEVEL_THRESHOLDS = [0, 200, 600, 1400, 3000] as const;

export const GATHER_CONFIG: Record<GatherAction, { cooldownMs: number; min: number; max: number; xp: number }> = {
  WOOD: { cooldownMs: 1200, min: 8, max: 12, xp: 8 },
  STONE: { cooldownMs: 1400, min: 6, max: 10, xp: 10 },
  IRON: { cooldownMs: 1800, min: 4, max: 8, xp: 14 },
};

export const MARKET_RATES: Record<Exclude<ResourceKey, "GOLD">, { batch: number; gold: number }> = {
  WOOD: { batch: 100, gold: 50 },
  STONE: { batch: 100, gold: 75 },
  IRON: { batch: 100, gold: 150 },
};

export const BUILDING_CONFIG: Record<
  BuildingKey,
  {
    name: string;
    cost: Partial<Record<ResourceKey, number>>;
    buildSeconds: number;
    productionPerMinute: Partial<Record<Exclude<ResourceKey, "GOLD">, number>>;
    xp: number;
  }
> = {
  WORKBENCH: {
    name: "Workbench",
    cost: { WOOD: 100 },
    buildSeconds: 5,
    productionPerMinute: {},
    xp: 40,
  },
  LUMBER_CAMP: {
    name: "Lumber Camp",
    cost: { WOOD: 120, STONE: 40 },
    buildSeconds: 8,
    productionPerMinute: { WOOD: 12 },
    xp: 55,
  },
  STONE_QUARRY: {
    name: "Stone Quarry",
    cost: { WOOD: 100, STONE: 120 },
    buildSeconds: 10,
    productionPerMinute: { STONE: 10 },
    xp: 60,
  },
  IRON_MINE: {
    name: "Iron Mine",
    cost: { WOOD: 120, STONE: 140, IRON: 40 },
    buildSeconds: 14,
    productionPerMinute: { IRON: 8 },
    xp: 75,
  },
  BLACKSMITH: {
    name: "Blacksmith",
    cost: { WOOD: 160, STONE: 160, IRON: 120 },
    buildSeconds: 18,
    productionPerMinute: { IRON: 4 },
    xp: 90,
  },
  MARKET: {
    name: "Market",
    cost: { WOOD: 140, STONE: 140, IRON: 100 },
    buildSeconds: 16,
    productionPerMinute: {},
    xp: 80,
  },
};

export const WORKER_CONFIG: Record<
  WorkerKey,
  {
    name: string;
    costGold: number;
    xp: number;
    boosts: Partial<Record<Exclude<ResourceKey, "GOLD">, number>>;
  }
> = {
  LUMBERJACK: { name: "Lumberjack", costGold: 200, xp: 35, boosts: { WOOD: 2 } },
  MINER: { name: "Miner", costGold: 280, xp: 40, boosts: { STONE: 2, IRON: 1 } },
  BLACKSMITH: { name: "Blacksmith", costGold: 380, xp: 45, boosts: { IRON: 2 } },
  BUILDER: { name: "Builder", costGold: 320, xp: 35, boosts: { WOOD: 1, STONE: 1 } },
};

export const QUESTS: Array<{
  key: QuestKey;
  title: string;
  target: number;
  metric: "WOOD" | "WORKBENCH" | "WORKER" | "GOLD";
  xpReward: number;
  goldReward: number;
  achievement?: AchievementKey;
}> = [
  {
    key: "GATHER_100_WOOD",
    title: "Gather 100 Wood",
    target: 100,
    metric: "WOOD",
    xpReward: 80,
    goldReward: 100,
  },
  {
    key: "BUILD_WORKBENCH",
    title: "Build your first Workbench",
    target: 1,
    metric: "WORKBENCH",
    xpReward: 120,
    goldReward: 120,
    achievement: "FIRST_BUILD",
  },
  {
    key: "HIRE_FIRST_WORKER",
    title: "Hire your first Worker",
    target: 1,
    metric: "WORKER",
    xpReward: 140,
    goldReward: 140,
    achievement: "FIRST_WORKER",
  },
  {
    key: "EARN_1000_GOLD",
    title: "Earn 1,000 Gold",
    target: 1000,
    metric: "GOLD",
    xpReward: 200,
    goldReward: 200,
    achievement: "FIRST_1000_GOLD",
  },
  {
    key: "EARN_10000_GOLD",
    title: "Earn 10,000 Gold",
    target: 10000,
    metric: "GOLD",
    xpReward: 1000,
    goldReward: 0,
    achievement: "REALM_COMPLETED",
  },
];

export const ACHIEVEMENTS: Record<AchievementKey, { title: string; description: string }> = {
  FIRST_BUILD: { title: "FIRST BUILD", description: "Built your first structure." },
  FIRST_WORKER: { title: "FIRST WORKER", description: "Hired your first worker." },
  MASTER_MINER: { title: "MASTER MINER", description: "Reached Iron Mine level 3." },
  MASTER_BUILDER: { title: "MASTER BUILDER", description: "Built 10 structures." },
  FIRST_1000_GOLD: { title: "FIRST 1,000 GOLD", description: "Reached 1,000 gold." },
  GOLD_10000: { title: "10,000 GOLD", description: "Reached 10,000 gold." },
  REALM_COMPLETED: { title: "REALM COMPLETED", description: "THE BUILDER HAS ASCENDED." },
};
