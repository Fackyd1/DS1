import type {
  DeadlandsAmmoType,
  DeadlandsEnemyKind,
  DeadlandsInventoryItem,
  DeadlandsMapPoint,
  DeadlandsMode,
  DeadlandsQuestSnapshot,
  DeadlandsSurvivalSnapshot,
  DeadlandsWeaponStats,
  DeadlandsZone,
} from "@/features/deadlands/types/game";

export const DEADLANDS_ZONES: Array<{ key: DeadlandsZone; difficulty: number; lootBias: string[] }> = [
  { key: "SAFE OUTSKIRTS", difficulty: 1, lootBias: ["FOOD", "WATER", "MATERIAL"] },
  { key: "INFESTED FOREST", difficulty: 2, lootBias: ["MATERIAL", "MEDICAL", "AMMO"] },
  { key: "ABANDONED CITY", difficulty: 3, lootBias: ["AMMO", "MEDICAL", "COMPONENT"] },
  { key: "MILITARY ZONE", difficulty: 4, lootBias: ["AMMO", "COMPONENT", "TOOL"] },
  { key: "DEAD ZONE", difficulty: 5, lootBias: ["QUEST", "COMPONENT", "MEDICAL"] },
];

export const DEADLANDS_MAP_POINTS: Array<{ key: DeadlandsMapPoint; zone: DeadlandsZone; lootTier: number }> = [
  { key: "SAFE HOUSE", zone: "SAFE OUTSKIRTS", lootTier: 1 },
  { key: "ABANDONED ROAD", zone: "SAFE OUTSKIRTS", lootTier: 1 },
  { key: "FOREST", zone: "INFESTED FOREST", lootTier: 2 },
  { key: "GAS STATION", zone: "ABANDONED CITY", lootTier: 2 },
  { key: "WAREHOUSE", zone: "ABANDONED CITY", lootTier: 3 },
  { key: "HOSPITAL", zone: "ABANDONED CITY", lootTier: 3 },
  { key: "POLICE STATION", zone: "MILITARY ZONE", lootTier: 4 },
  { key: "MILITARY CHECKPOINT", zone: "DEAD ZONE", lootTier: 5 },
];

export const DEADLANDS_WEAPONS: Record<string, DeadlandsWeaponStats> = {
  SIDEARM_9: {
    id: "SIDEARM_9",
    name: "Sidearm-9",
    type: "PISTOL",
    ammoType: "LIGHT_AMMO",
    damage: 18,
    fireRateMs: 220,
    magazineSize: 12,
    reloadTimeMs: 1200,
    range: 420,
    accuracy: 0.94,
    durability: 100,
    rarity: "COMMON",
  },
  SCRAP_AXE: {
    id: "SCRAP_AXE",
    name: "Scrap Axe",
    type: "MELEE",
    damage: 24,
    fireRateMs: 600,
    magazineSize: 0,
    reloadTimeMs: 0,
    range: 44,
    accuracy: 1,
    durability: 100,
    rarity: "COMMON",
    staminaCost: 12,
  },
};

export const DEADLANDS_ENEMY_TEMPLATES: Record<DeadlandsEnemyKind, { hp: number; speed: number; damage: number; aggro: number; color: number; xp: number }> = {
  NORMAL_ZOMBIE: { hp: 42, speed: 44, damage: 8, aggro: 180, color: 0x7e8d63, xp: 15 },
  RUNNER: { hp: 26, speed: 88, damage: 10, aggro: 210, color: 0xd16d5b, xp: 18 },
  BRUTE: { hp: 90, speed: 32, damage: 18, aggro: 160, color: 0x9b6a40, xp: 36 },
  SCREAMER: { hp: 28, speed: 50, damage: 6, aggro: 220, color: 0xa565c7, xp: 22 },
  BOSS_ZOMBIE: { hp: 180, speed: 36, damage: 24, aggro: 260, color: 0xb3261e, xp: 120 },
};

export const DEADLANDS_STARTER_INVENTORY: DeadlandsInventoryItem[] = [
  {
    id: "CANNED_BEANS",
    name: "Canned Beans",
    description: "Reliable calories scavenged from the outskirts.",
    type: "FOOD",
    rarity: "COMMON",
    quantity: 2,
    maxStack: 6,
    weight: 0.4,
    value: 12,
  },
  {
    id: "DIRTY_WATER",
    name: "Dirty Water",
    description: "Unsafe to drink without treatment, but still usable in emergencies.",
    type: "WATER",
    rarity: "COMMON",
    quantity: 2,
    maxStack: 6,
    weight: 0.5,
    value: 10,
  },
  {
    id: "RAG",
    name: "Rag",
    description: "Basic fabric used for field crafting.",
    type: "MATERIAL",
    rarity: "COMMON",
    quantity: 4,
    maxStack: 12,
    weight: 0.15,
    value: 4,
  },
  {
    id: "SCRAP_METAL",
    name: "Scrap Metal",
    description: "Rusty but useful salvage for barricades and repairs.",
    type: "MATERIAL",
    rarity: "COMMON",
    quantity: 3,
    maxStack: 12,
    weight: 0.35,
    value: 6,
  },
  {
    id: "LIGHT_AMMO",
    name: "Light Ammo",
    description: "Generic light rounds for compact firearms.",
    type: "AMMO",
    rarity: "COMMON",
    quantity: 18,
    maxStack: 60,
    weight: 0.03,
    value: 2,
  },
];

export const DEADLANDS_STARTER_QUESTS: DeadlandsQuestSnapshot[] = [
  {
    key: "SCAVENGE_STARTER",
    title: "Scavenge Starter Supplies",
    description: "Gather 6 useful items from the outskirts.",
    progress: 0,
    target: 6,
    completed: false,
    rewardText: "+40 XP · +20 Credits",
  },
  {
    key: "FIRST_BLOOD",
    title: "First Blood",
    description: "Eliminate 8 infected in the outskirts.",
    progress: 0,
    target: 8,
    completed: false,
    rewardText: "+60 XP · Basic Medkit",
  },
  {
    key: "FORTIFY_HOME",
    title: "Fortify the Safe House",
    description: "Build 3 barricades around the shelter.",
    progress: 0,
    target: 3,
    completed: false,
    rewardText: "+80 XP · Shelter Level 2 access",
  },
  {
    key: "SURVIVE_NIGHT",
    title: "Survive the First Night",
    description: "Stay alive until dawn.",
    progress: 0,
    target: 1,
    completed: false,
    rewardText: "+100 XP · Night Cache marker",
  },
];

export const DEADLANDS_RECIPE_COSTS = {
  CRAFT_BANDAGE: [
    { id: "RAG", amount: 2 },
  ],
  CRAFT_LIGHT_AMMO: [
    { id: "SCRAP_METAL", amount: 1 },
    { id: "RAG", amount: 1 },
  ],
  CRAFT_WATER: [
    { id: "DIRTY_WATER", amount: 1 },
  ],
  BUILD_BARRICADE: [
    { id: "SCRAP_METAL", amount: 2 },
    { id: "RAG", amount: 1 },
  ],
} as const;

export const DEADLANDS_ITEM_REWARDS: Record<string, DeadlandsInventoryItem> = {
  BANDAGE: {
    id: "BANDAGE",
    name: "Bandage",
    description: "Field wrap that restores a small amount of health.",
    type: "MEDICAL",
    rarity: "COMMON",
    quantity: 1,
    maxStack: 6,
    weight: 0.1,
    value: 18,
  },
  CLEAN_WATER: {
    id: "CLEAN_WATER",
    name: "Clean Water",
    description: "Restores thirst safely.",
    type: "WATER",
    rarity: "UNCOMMON",
    quantity: 1,
    maxStack: 6,
    weight: 0.45,
    value: 20,
  },
};

export function createInitialDeadlandsSnapshot(mode: DeadlandsMode = "NORMAL"): DeadlandsSurvivalSnapshot {
  const ammoReserve: Record<DeadlandsAmmoType, number> = {
    LIGHT_AMMO: 36,
    HEAVY_AMMO: 0,
    SHOTGUN_SHELLS: 0,
    SPECIAL_AMMO: 0,
  };

  return {
    health: mode === "HARD" ? 82 : 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    hunger: mode === "SURVIVAL" ? 70 : 100,
    thirst: mode === "SURVIVAL" ? 70 : 100,
    temperature: 37,
    level: 1,
    xp: 0,
    skillPoints: 0,
    survivalDays: 1,
    kills: 0,
    deaths: 0,
    distanceTraveled: 0,
    currency: 25,
    shelterLevel: 1,
    zone: "SAFE OUTSKIRTS",
    mapPoint: "SAFE HOUSE",
    dayPhase: "DAY",
    dayClock: 0,
    mode,
    eventLabel: "Quiet morning in the outskirts.",
    gameOver: false,
    currentWeaponId: "SIDEARM_9",
    ammoReserve,
    inventory: DEADLANDS_STARTER_INVENTORY.map((item) => ({ ...item })),
    quests: DEADLANDS_STARTER_QUESTS.map((quest) => ({ ...quest })),
    notifications: ["Wake up. Secure water, food and the safe house."],
    achievements: [],
    desktopRecommended: true,
    activeZombieCount: 0,
    shelterBarricades: 0,
  };
}
