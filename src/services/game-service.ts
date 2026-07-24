import {
  ACHIEVEMENTS,
  BUILDING_CONFIG,
  GATHER_CONFIG,
  LEVEL_THRESHOLDS,
  MARKET_RATES,
  QUESTS,
  WORKER_CONFIG,
} from "@/game/data/balance";
import { publishEvent } from "@/services/realtime-service";
import type {
  AchievementKey,
  BuildingKey,
  GameActionResult,
  GatherAction,
  PlayerQuestState,
  PlayerState,
  ResourceKey,
  WorkerKey,
} from "@/types/game";

const playerStore = new Map<string, PlayerState>();

export function __resetGameStateForTests(): void {
  playerStore.clear();
}

function nowIso(): string {
  return new Date().toISOString();
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getLevelFromXp(xp: number): number {
  let level = 1;
  LEVEL_THRESHOLDS.forEach((threshold, index) => {
    if (xp >= threshold) {
      level = index + 1;
    }
  });

  return Math.min(5, level);
}

function createInitialQuests(): PlayerQuestState[] {
  return QUESTS.map((quest) => ({
    key: quest.key,
    progress: 0,
    completed: false,
  }));
}

function createInitialPlayer(playerTag: string, userId?: string): PlayerState {
  const now = nowIso();
  return {
    playerTag,
    userId,
    level: 1,
    xp: 0,
    resources: { WOOD: 0, STONE: 0, IRON: 0, GOLD: 0 },
    buildings: [],
    workers: [],
    achievements: [],
    quests: createInitialQuests(),
    playTimeSeconds: 0,
    createdAt: now,
    updatedAt: now,
    cooldowns: {},
    lastTickAt: Date.now(),
  };
}

function spendResources(player: PlayerState, costs: Partial<Record<ResourceKey, number>>): void {
  for (const [resource, amount] of Object.entries(costs) as Array<[ResourceKey, number]>) {
    if (player.resources[resource] < amount) {
      throw new Error(`NOT_ENOUGH_${resource}`);
    }
  }

  for (const [resource, amount] of Object.entries(costs) as Array<[ResourceKey, number]>) {
    player.resources[resource] -= amount;
  }
}

function grantXp(player: PlayerState, amount: number): void {
  player.xp += amount;
  player.level = getLevelFromXp(player.xp);
}

function unlockAchievement(player: PlayerState, key: AchievementKey): void {
  if (player.achievements.includes(key)) {
    return;
  }

  player.achievements.push(key);
  const info = ACHIEVEMENTS[key];
  publishEvent(`${player.playerTag} unlocked ${info.title}.`);
}

function checkQuestCompletions(player: PlayerState): void {
  for (const quest of QUESTS) {
    const playerQuest = player.quests.find((item) => item.key === quest.key);
    if (!playerQuest || playerQuest.completed) {
      continue;
    }

    if (quest.metric === "WOOD") {
      playerQuest.progress = Math.max(playerQuest.progress, player.resources.WOOD);
    }

    if (quest.metric === "WORKBENCH") {
      const wb = player.buildings.find((building) => building.key === "WORKBENCH");
      playerQuest.progress = Math.max(playerQuest.progress, wb ? wb.quantity : 0);
    }

    if (quest.metric === "WORKER") {
      const totalWorkers = player.workers.reduce((sum, worker) => sum + worker.quantity, 0);
      playerQuest.progress = Math.max(playerQuest.progress, totalWorkers);
    }

    if (quest.metric === "GOLD") {
      playerQuest.progress = Math.max(playerQuest.progress, player.resources.GOLD);
    }

    if (playerQuest.progress >= quest.target) {
      playerQuest.completed = true;
      playerQuest.completedAt = nowIso();
      player.resources.GOLD += quest.goldReward;
      grantXp(player, quest.xpReward);
      if (quest.achievement) {
        unlockAchievement(player, quest.achievement);
      }
      publishEvent(`${player.playerTag} completed quest: ${quest.title}.`);
    }
  }

  if (player.resources.GOLD >= 10000) {
    unlockAchievement(player, "GOLD_10000");
    unlockAchievement(player, "REALM_COMPLETED");
  }

  const totalBuildings = player.buildings.reduce((sum, building) => sum + building.quantity, 0);
  if (totalBuildings >= 10) {
    unlockAchievement(player, "MASTER_BUILDER");
  }

  const ironMine = player.buildings.find((building) => building.key === "IRON_MINE");
  if (ironMine && ironMine.level >= 3) {
    unlockAchievement(player, "MASTER_MINER");
  }
}

function applyAutomation(player: PlayerState): void {
  const now = Date.now();
  const elapsedMinutes = Math.max(0, (now - player.lastTickAt) / 60000);
  if (elapsedMinutes <= 0) {
    return;
  }

  for (const building of player.buildings) {
    const config = BUILDING_CONFIG[building.key];
    for (const [resource, amount] of Object.entries(config.productionPerMinute) as Array<
      [Exclude<ResourceKey, "GOLD">, number]
    >) {
      player.resources[resource] += Math.floor(amount * building.quantity * elapsedMinutes);
    }
  }

  for (const worker of player.workers) {
    const config = WORKER_CONFIG[worker.key];
    for (const [resource, boost] of Object.entries(config.boosts) as Array<
      [Exclude<ResourceKey, "GOLD">, number]
    >) {
      player.resources[resource] += Math.floor(boost * worker.quantity * elapsedMinutes);
    }
  }

  player.playTimeSeconds += Math.floor((now - player.lastTickAt) / 1000);
  player.lastTickAt = now;
}

function touchPlayer(player: PlayerState): void {
  applyAutomation(player);
  checkQuestCompletions(player);
  player.updatedAt = nowIso();
}

export function getOrCreatePlayer(playerTag: string, userId?: string): PlayerState {
  const existing = playerStore.get(playerTag);
  if (existing) {
    if (userId && !existing.userId) {
      existing.userId = userId;
    }
    touchPlayer(existing);
    return existing;
  }

  const player = createInitialPlayer(playerTag, userId);
  playerStore.set(playerTag, player);
  return player;
}

export function gatherResource(playerTag: string, action: GatherAction): GameActionResult {
  const player = getOrCreatePlayer(playerTag);
  touchPlayer(player);

  const config = GATHER_CONFIG[action];
  const cooldownUntil = player.cooldowns[action] ?? 0;
  const now = Date.now();
  if (cooldownUntil > now) {
    throw new Error(`COOLDOWN_${action}_${cooldownUntil - now}`);
  }

  const toolsBonus = player.buildings.find((item) => item.key === "BLACKSMITH")?.level ?? 0;
  const workersBonus = player.workers
    .filter((worker) => worker.key === "LUMBERJACK" || worker.key === "MINER")
    .reduce((sum, worker) => sum + worker.quantity, 0);

  const amount = randomBetween(config.min, config.max) + toolsBonus + Math.floor(workersBonus / 2);
  player.resources[action] += amount;
  grantXp(player, config.xp + toolsBonus);
  player.cooldowns[action] = now + Math.max(350, config.cooldownMs - toolsBonus * 40);

  checkQuestCompletions(player);
  player.updatedAt = nowIso();

  return { player, message: `Gathered ${amount} ${action}.` };
}

export function buildStructure(playerTag: string, buildingKey: BuildingKey): GameActionResult {
  const player = getOrCreatePlayer(playerTag);
  touchPlayer(player);

  const config = BUILDING_CONFIG[buildingKey];

  if (buildingKey !== "WORKBENCH") {
    const hasWorkbench = player.buildings.some((building) => building.key === "WORKBENCH");
    if (!hasWorkbench) {
      throw new Error("WORKBENCH_REQUIRED");
    }
  }

  spendResources(player, config.cost);

  const existing = player.buildings.find((building) => building.key === buildingKey);
  if (existing) {
    existing.quantity += 1;
    existing.level += 1;
  } else {
    player.buildings.push({ key: buildingKey, level: 1, quantity: 1 });
  }

  grantXp(player, config.xp);
  unlockAchievement(player, "FIRST_BUILD");
  checkQuestCompletions(player);
  player.updatedAt = nowIso();

  return { player, message: `Built ${config.name}.` };
}

export function hireWorker(playerTag: string, workerKey: WorkerKey): GameActionResult {
  const player = getOrCreatePlayer(playerTag);
  touchPlayer(player);

  const config = WORKER_CONFIG[workerKey];
  if (player.resources.GOLD < config.costGold) {
    throw new Error("NOT_ENOUGH_GOLD");
  }

  player.resources.GOLD -= config.costGold;

  const existing = player.workers.find((worker) => worker.key === workerKey);
  if (existing) {
    existing.quantity += 1;
    existing.level += 1;
  } else {
    player.workers.push({ key: workerKey, level: 1, quantity: 1 });
  }

  grantXp(player, config.xp);
  unlockAchievement(player, "FIRST_WORKER");
  checkQuestCompletions(player);
  player.updatedAt = nowIso();

  return { player, message: `Hired ${config.name}.` };
}

export function sellResource(playerTag: string, resource: Exclude<ResourceKey, "GOLD">, amount: number): GameActionResult {
  const player = getOrCreatePlayer(playerTag);
  touchPlayer(player);

  const rate = MARKET_RATES[resource];
  if (amount < rate.batch || amount % rate.batch !== 0) {
    throw new Error(`INVALID_AMOUNT_${rate.batch}`);
  }

  if (player.resources[resource] < amount) {
    throw new Error(`NOT_ENOUGH_${resource}`);
  }

  const multiplier = amount / rate.batch;
  const earned = rate.gold * multiplier;

  player.resources[resource] -= amount;
  player.resources.GOLD += earned;
  grantXp(player, Math.floor(multiplier * 12));

  checkQuestCompletions(player);
  player.updatedAt = nowIso();

  return { player, message: `Sold ${amount} ${resource} for ${earned} GOLD.` };
}

export function claimTimedUpgrade(playerTag: string): GameActionResult {
  const player = getOrCreatePlayer(playerTag);
  touchPlayer(player);

  const workbenchLevel = player.buildings.find((building) => building.key === "WORKBENCH")?.level ?? 0;
  const marketLevel = player.buildings.find((building) => building.key === "MARKET")?.level ?? 0;

  const upgrade = {
    WOOD: 60 + workbenchLevel * 12,
    STONE: 45 + marketLevel * 10,
    IRON: 30 + Math.max(workbenchLevel, marketLevel) * 8,
    GOLD: 20 + workbenchLevel * 4 + marketLevel * 4,
  } satisfies Record<ResourceKey, number>;

  player.resources.WOOD += upgrade.WOOD;
  player.resources.STONE += upgrade.STONE;
  player.resources.IRON += upgrade.IRON;
  player.resources.GOLD += upgrade.GOLD;
  grantXp(player, 30 + Math.floor((workbenchLevel + marketLevel) / 2) * 5);

  publishEvent(`${player.playerTag} claimed a timed upgrade.`);
  checkQuestCompletions(player);
  player.updatedAt = nowIso();

  return {
    player,
    message: `Timed upgrade claimed. +${upgrade.WOOD} WOOD, +${upgrade.STONE} STONE, +${upgrade.IRON} IRON, +${upgrade.GOLD} GOLD.`,
  };
}

export function getLeaderboard() {
  const entries = [...playerStore.values()].map((player) => ({
    player: player.playerTag,
    level: player.level,
    gold: player.resources.GOLD,
    achievements: player.achievements.length,
    time: player.playTimeSeconds,
  }));

  return entries
    .sort((a, b) => b.gold - a.gold || b.level - a.level || b.achievements - a.achievements)
    .map((entry, index) => ({ rank: index + 1, ...entry }));
}

export function getActivePlayersCount(): number {
  return playerStore.size;
}
