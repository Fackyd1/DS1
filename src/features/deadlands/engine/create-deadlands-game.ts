import {
  DEADLANDS_CANVAS_HEIGHT,
  DEADLANDS_CANVAS_WIDTH,
  DEADLANDS_GAME_ID,
} from "@/features/deadlands/config/game-config";
import { createDeadlandsRuntimeScene } from "@/features/deadlands/scenes/runtime-scene";

export async function createDeadlandsGame(parent: HTMLDivElement) {
  const PhaserModule = await import("phaser");
  const Phaser = PhaserModule.default;
  const DeadlandsRuntimeScene = createDeadlandsRuntimeScene(PhaserModule);

  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: DEADLANDS_CANVAS_WIDTH,
    height: DEADLANDS_CANVAS_HEIGHT,
    backgroundColor: "#090c10",
    scene: [DeadlandsRuntimeScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: DEADLANDS_CANVAS_WIDTH,
      height: DEADLANDS_CANVAS_HEIGHT,
    },
    render: {
      pixelArt: false,
      antialias: true,
    },
    physics: {
      default: "arcade",
      arcade: {
        debug: false,
      },
    },
    title: DEADLANDS_GAME_ID,
  });
}
