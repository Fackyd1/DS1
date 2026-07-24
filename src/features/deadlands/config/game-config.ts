export const DEADLANDS_GAME_ID = "deadlands-survival";
export const DEADLANDS_CANVAS_WIDTH = 960;
export const DEADLANDS_CANVAS_HEIGHT = 540;

export const DEADLANDS_PHASE = {
  current: "PLAYABLE VERTICAL SLICE",
  title: "Survival Runtime Online",
  summary: "Deadlands now runs as a playable top-down PvE survival prototype with exploration, scavenging, combat, crafting, shelter defense and progression hooks.",
} as const;

export const DEADLANDS_WORLD_ZONES = [
  "SAFE OUTSKIRTS",
  "INFESTED FOREST",
  "ABANDONED CITY",
  "MILITARY ZONE",
  "DEAD ZONE",
] as const;

export const DEADLANDS_MAP_POINTS = [
  "FOREST",
  "ABANDONED ROAD",
  "GAS STATION",
  "WAREHOUSE",
  "HOSPITAL",
  "POLICE STATION",
  "SAFE HOUSE",
  "MILITARY CHECKPOINT",
] as const;

export const DEADLANDS_PHASE_ONE_FEATURES = [
  "Top-down Phaser survival runtime",
  "Real-time player movement, sprint and combat",
  "Zone travel, scavenging nodes and loot pickups",
  "Crafting, barricade building and shelter progression",
  "Day-night pressure, quests, events and death loop",
] as const;
