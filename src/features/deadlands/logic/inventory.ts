import { DEADLANDS_ITEM_REWARDS, DEADLANDS_RECIPE_COSTS } from "@/features/deadlands/data/content";
import type { DeadlandsInventoryItem } from "@/features/deadlands/types/game";

export function cloneInventory(items: DeadlandsInventoryItem[]) {
  return items.map((item) => ({ ...item }));
}

export function calculateInventoryWeight(items: DeadlandsInventoryItem[]) {
  return items.reduce((sum, item) => sum + item.weight * item.quantity, 0);
}

export function countInventoryItem(items: DeadlandsInventoryItem[], itemId: string) {
  return items.filter((item) => item.id === itemId).reduce((sum, item) => sum + item.quantity, 0);
}

export function addInventoryItem(items: DeadlandsInventoryItem[], incoming: DeadlandsInventoryItem) {
  const next = cloneInventory(items);
  let remaining = incoming.quantity;

  for (const item of next) {
    if (item.id !== incoming.id || item.quantity >= item.maxStack) {
      continue;
    }

    const room = item.maxStack - item.quantity;
    const add = Math.min(room, remaining);
    item.quantity += add;
    remaining -= add;

    if (remaining <= 0) {
      return next;
    }
  }

  while (remaining > 0) {
    const quantity = Math.min(incoming.maxStack, remaining);
    next.push({ ...incoming, quantity });
    remaining -= quantity;
  }

  return next;
}

export function consumeInventoryItems(items: DeadlandsInventoryItem[], costs: Array<{ id: string; amount: number }>) {
  const next = cloneInventory(items);

  for (const cost of costs) {
    if (countInventoryItem(next, cost.id) < cost.amount) {
      return null;
    }
  }

  for (const cost of costs) {
    let remaining = cost.amount;
    for (const item of next) {
      if (item.id !== cost.id || remaining <= 0) {
        continue;
      }

      const consumed = Math.min(item.quantity, remaining);
      item.quantity -= consumed;
      remaining -= consumed;
    }
  }

  return next.filter((item) => item.quantity > 0);
}

export function craftInventory(items: DeadlandsInventoryItem[], recipe: keyof typeof DEADLANDS_RECIPE_COSTS) {
  const consumed = consumeInventoryItems(items, [...DEADLANDS_RECIPE_COSTS[recipe]]);
  if (!consumed) {
    return null;
  }

  if (recipe === "CRAFT_BANDAGE") {
    return addInventoryItem(consumed, DEADLANDS_ITEM_REWARDS.BANDAGE);
  }

  if (recipe === "CRAFT_WATER") {
    return addInventoryItem(consumed, DEADLANDS_ITEM_REWARDS.CLEAN_WATER);
  }

  if (recipe === "CRAFT_LIGHT_AMMO") {
    return addInventoryItem(consumed, {
      id: "LIGHT_AMMO",
      name: "Light Ammo",
      description: "Freshly packed compact rounds.",
      type: "AMMO",
      rarity: "COMMON",
      quantity: 8,
      maxStack: 60,
      weight: 0.03,
      value: 2,
    });
  }

  return consumed;
}
