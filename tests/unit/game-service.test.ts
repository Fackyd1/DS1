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

describe("game-service", () => {
  const tag = "DS1_TEST";

  beforeEach(() => {
    __resetGameStateForTests();
  });

  it("creates player with initial resources", () => {
    const player = getOrCreatePlayer(tag);
    assert.equal(player.resources.WOOD, 0);
    assert.equal(player.level, 1);
  });

  it("gathers resources and gains xp", () => {
    const result = gatherResource(tag, "WOOD");
    assert.ok(result.player.resources.WOOD > 0);
    assert.ok(result.player.xp > 0);
  });

  it("requires workbench for advanced buildings", () => {
    assert.throws(() => buildStructure(tag, "LUMBER_CAMP"), /WORKBENCH_REQUIRED/);
  });

  it("sells resources in valid batches only", () => {
    const player = getOrCreatePlayer(tag);
    player.resources.WOOD = 100;
    const result = sellResource(tag, "WOOD", 100);
    assert.ok(result.player.resources.GOLD > 0);
  });

  it("hiring worker costs gold", () => {
    const player = getOrCreatePlayer(tag);
    player.resources.GOLD = 1000;
    const result = hireWorker(tag, "LUMBERJACK");
    assert.equal(result.player.workers[0]?.key, "LUMBERJACK");
  });
});
