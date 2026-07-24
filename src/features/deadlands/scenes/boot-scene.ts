import {
  DEADLANDS_CANVAS_HEIGHT,
  DEADLANDS_CANVAS_WIDTH,
  DEADLANDS_MAP_POINTS,
  DEADLANDS_PHASE,
} from "@/features/deadlands/config/game-config";

export function createDeadlandsBootScene(Phaser: typeof import("phaser")) {
  return class DeadlandsBootScene extends Phaser.Scene {
    constructor() {
      super("DeadlandsBootScene");
    }

    create() {
      const background = this.add.graphics();
      background.fillGradientStyle(0x0f1318, 0x161b22, 0x11161c, 0x090c10, 1, 1, 1, 1);
      background.fillRect(0, 0, DEADLANDS_CANVAS_WIDTH, DEADLANDS_CANVAS_HEIGHT);

      const grid = this.add.graphics({ lineStyle: { width: 1, color: 0x1f2b36, alpha: 0.35 } });
      for (let x = 0; x <= DEADLANDS_CANVAS_WIDTH; x += 48) {
        grid.lineBetween(x, 0, x, DEADLANDS_CANVAS_HEIGHT);
      }
      for (let y = 0; y <= DEADLANDS_CANVAS_HEIGHT; y += 48) {
        grid.lineBetween(0, y, DEADLANDS_CANVAS_WIDTH, y);
      }

      this.add
        .text(48, 40, "DEADLANDS: SURVIVAL", {
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: "34px",
          color: "#f4efe5",
        })
        .setShadow(0, 0, "#d16d5b", 10);

      this.add.text(48, 88, `${DEADLANDS_PHASE.current} · ${DEADLANDS_PHASE.title}`, {
        fontFamily: "Space Grotesk, sans-serif",
        fontSize: "16px",
        color: "#9fb2bf",
      });

      this.add.text(48, 140, "Compact map bootstrap ready for the next gameplay phase.", {
        fontFamily: "Space Grotesk, sans-serif",
        fontSize: "18px",
        color: "#dfe7ee",
      });

      DEADLANDS_MAP_POINTS.forEach((point, index) => {
        const col = index % 4;
        const row = Math.floor(index / 4);
        const x = 84 + col * 210;
        const y = 250 + row * 118;

        const marker = this.add.rectangle(x, y, 152, 56, 0x162029, 0.95);
        marker.setStrokeStyle(1, 0x4eb1a8, 0.45);

        this.add.text(x - 60, y - 10, point, {
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: "14px",
          color: "#f4efe5",
        });
      });

      const pulse = this.add.rectangle(812, 112, 112, 112, 0xb34d3d, 0.18);
      pulse.setStrokeStyle(2, 0xd6c4a0, 0.5);
      this.tweens.add({
        targets: pulse,
        scaleX: 1.08,
        scaleY: 1.08,
        alpha: 0.3,
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: "Sine.InOut",
      });

      this.add.text(748, 188, "Runtime online", {
        fontFamily: "Space Grotesk, sans-serif",
        fontSize: "14px",
        color: "#d6c4a0",
      });
    }
  };
}
