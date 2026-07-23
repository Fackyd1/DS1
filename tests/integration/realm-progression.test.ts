import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import {
  __resetGameStateForTests,
  buildStructure,
  gatherResource,
  getOrCreatePlayer,
  hireWorker,
  sellResource,
} from "@/services/game-service";

describe("realm progression integration", () => {
  const tag = "DS1_FLOW";

  beforeEach(() => {
    __resetGameStateForTests();
  });

  it("runs gather -> build -> hire -> sell loop", () => {
    const player = getOrCreatePlayer(tag);
    player.resources.WOOD = 300;
    player.resources.STONE = 300;
    player.resources.IRON = 300;

    buildStructure(tag, "WORKBENCH");
    buildStructure(tag, "MARKET");

    gatherResource(tag, "WOOD");
    gatherResource(tag, "STONE");

    player.resources.GOLD = 500;
    hireWorker(tag, "LUMBERJACK");

    player.resources.WOOD = 200;
    sellResource(tag, "WOOD", 100);

    const updated = getOrCreatePlayer(tag);
    assert.ok(updated.level >= 1);
    assert.ok(updated.resources.GOLD >= 50);
    assert.ok(updated.buildings.length > 0);
  });
});
