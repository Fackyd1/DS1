export type DeadlandsZone =
  | "SAFE OUTSKIRTS"
  | "INFESTED FOREST"
  | "ABANDONED CITY"
  | "MILITARY ZONE"
  | "DEAD ZONE";

export type DeadlandsMapPoint =
  | "FOREST"
  | "ABANDONED ROAD"
  | "GAS STATION"
  | "WAREHOUSE"
  | "HOSPITAL"
  | "POLICE STATION"
  | "SAFE HOUSE"
  | "MILITARY CHECKPOINT";

export type DeadlandsPhaseKey = "PHASE_1";

export type DeadlandsRuntimeStatus = "booting" | "ready" | "stopped";

export type DeadlandsDayPhase = "DAY" | "EVENING" | "NIGHT" | "DAWN";

export type DeadlandsMode = "NORMAL" | "HARD" | "SURVIVAL";

export type DeadlandsRarity = "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY";

export type DeadlandsItemType =
  | "FOOD"
  | "WATER"
  | "MEDICAL"
  | "AMMO"
  | "MATERIAL"
  | "TOOL"
  | "COMPONENT"
  | "QUEST"
  | "BUILDING";

export type DeadlandsAmmoType = "LIGHT_AMMO" | "HEAVY_AMMO" | "SHOTGUN_SHELLS" | "SPECIAL_AMMO";

export type DeadlandsWeaponType = "PISTOL" | "SHOTGUN" | "SMG" | "RIFLE" | "SNIPER" | "MELEE";

export type DeadlandsEnemyKind = "NORMAL_ZOMBIE" | "RUNNER" | "BRUTE" | "SCREAMER" | "BOSS_ZOMBIE";

export type DeadlandsInventoryItem = {
  id: string;
  name: string;
  description: string;
  type: DeadlandsItemType;
  rarity: DeadlandsRarity;
  quantity: number;
  maxStack: number;
  weight: number;
  durability?: number;
  value: number;
};

export type DeadlandsQuestSnapshot = {
  key: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  completed: boolean;
  rewardText: string;
};

export type DeadlandsWeaponStats = {
  id: string;
  name: string;
  type: DeadlandsWeaponType;
  ammoType?: DeadlandsAmmoType;
  damage: number;
  fireRateMs: number;
  magazineSize: number;
  reloadTimeMs: number;
  range: number;
  accuracy: number;
  durability: number;
  rarity: DeadlandsRarity;
  staminaCost?: number;
};

export type DeadlandsSurvivalSnapshot = {
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  hunger: number;
  thirst: number;
  temperature: number;
  level: number;
  xp: number;
  skillPoints: number;
  survivalDays: number;
  kills: number;
  deaths: number;
  distanceTraveled: number;
  currency: number;
  shelterLevel: number;
  zone: DeadlandsZone;
  mapPoint: DeadlandsMapPoint;
  dayPhase: DeadlandsDayPhase;
  dayClock: number;
  mode: DeadlandsMode;
  eventLabel: string;
  gameOver: boolean;
  currentWeaponId: string;
  ammoReserve: Record<DeadlandsAmmoType, number>;
  inventory: DeadlandsInventoryItem[];
  quests: DeadlandsQuestSnapshot[];
  notifications: string[];
  achievements: string[];
  desktopRecommended: boolean;
  activeZombieCount: number;
  shelterBarricades: number;
};

export type DeadlandsCommandType =
  | "CRAFT_BANDAGE"
  | "CRAFT_LIGHT_AMMO"
  | "CRAFT_WATER"
  | "BUILD_BARRICADE"
  | "USE_BANDAGE"
  | "USE_WATER"
  | "USE_FOOD"
  | "CHANGE_MODE"
  | "TRAVEL_ZONE"
  | "TRAVEL_POINT"
  | "RESTART";

export type DeadlandsCommand = {
  id: string;
  type: DeadlandsCommandType;
  payload?: string;
};
