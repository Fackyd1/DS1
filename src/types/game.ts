export type ResourceKey = "WOOD" | "STONE" | "IRON" | "GOLD";

export type GatherAction = "WOOD" | "STONE" | "IRON";

export type BuildingKey =
  | "WORKBENCH"
  | "LUMBER_CAMP"
  | "STONE_QUARRY"
  | "IRON_MINE"
  | "BLACKSMITH"
  | "MARKET";

export type WorkerKey = "LUMBERJACK" | "MINER" | "BLACKSMITH" | "BUILDER";

export type PlayerResources = Record<ResourceKey, number>;

export type BuildingState = {
  key: BuildingKey;
  level: number;
  quantity: number;
};

export type WorkerState = {
  key: WorkerKey;
  level: number;
  quantity: number;
};

export type QuestKey =
  | "GATHER_100_WOOD"
  | "BUILD_WORKBENCH"
  | "HIRE_FIRST_WORKER"
  | "EARN_1000_GOLD"
  | "EARN_10000_GOLD";

export type AchievementKey =
  | "FIRST_BUILD"
  | "FIRST_WORKER"
  | "MASTER_MINER"
  | "MASTER_BUILDER"
  | "FIRST_1000_GOLD"
  | "GOLD_10000"
  | "REALM_COMPLETED";

export type PlayerQuestState = {
  key: QuestKey;
  progress: number;
  completed: boolean;
  completedAt?: string;
};

export type PlayerState = {
  playerTag: string;
  userId?: string;
  level: number;
  xp: number;
  resources: PlayerResources;
  buildings: BuildingState[];
  workers: WorkerState[];
  achievements: AchievementKey[];
  quests: PlayerQuestState[];
  playTimeSeconds: number;
  createdAt: string;
  updatedAt: string;
  cooldowns: Partial<Record<GatherAction, number>>;
  lastTickAt: number;
};

export type GameActionResult = {
  player: PlayerState;
  message: string;
};
