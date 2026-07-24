import {
  createInitialDeadlandsSnapshot,
  DEADLANDS_ENEMY_TEMPLATES,
  DEADLANDS_ITEM_REWARDS,
  DEADLANDS_WEAPONS,
  DEADLANDS_ZONES,
} from "@/features/deadlands/data/content";
import {
  addInventoryItem,
  calculateInventoryWeight,
  consumeInventoryItems,
  countInventoryItem,
  craftInventory,
} from "@/features/deadlands/logic/inventory";
import { useDeadlandsStore } from "@/features/deadlands/state/deadlands-store";
import type {
  DeadlandsCommand,
  DeadlandsDayPhase,
  DeadlandsEnemyKind,
  DeadlandsInventoryItem,
  DeadlandsMapPoint,
  DeadlandsMode,
  DeadlandsSurvivalSnapshot,
  DeadlandsZone,
} from "@/features/deadlands/types/game";

type RuntimeZombie = {
  id: number;
  kind: DeadlandsEnemyKind;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  aggro: number;
  state: "WANDER" | "CHASE" | "ATTACK";
  body: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  nextAttackAt: number;
  wanderAngle: number;
};

type RuntimePickup = {
  id: number;
  label: string;
  body: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  reward: DeadlandsInventoryItem;
};

type ResourceNode = {
  id: number;
  point: DeadlandsMapPoint;
  body: Phaser.GameObjects.Rectangle;
  rewardPool: Array<DeadlandsInventoryItem>;
  label: Phaser.GameObjects.Text;
  consumed: boolean;
};

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1600;
const PLAYER_SPEED = 165;
const PLAYER_SPRINT_SPEED = 255;
const BULLET_SPEED = 520;
const INTERACT_RANGE = 60;
const DAY_LENGTH_SECONDS = 240;
const INVENTORY_WEIGHT_LIMIT = 18;
const PIXEL_TEXTURE_KEY = "deadlands-runtime-pixel";

const MAP_LAYOUT: Array<{ point: DeadlandsMapPoint; zone: DeadlandsZone; x: number; y: number; color: number }> = [
  { point: "SAFE HOUSE", zone: "SAFE OUTSKIRTS", x: 320, y: 320, color: 0x1f4030 },
  { point: "ABANDONED ROAD", zone: "SAFE OUTSKIRTS", x: 620, y: 300, color: 0x4a473f },
  { point: "FOREST", zone: "INFESTED FOREST", x: 940, y: 460, color: 0x294132 },
  { point: "GAS STATION", zone: "ABANDONED CITY", x: 1250, y: 420, color: 0x53423d },
  { point: "WAREHOUSE", zone: "ABANDONED CITY", x: 1510, y: 690, color: 0x343f4f },
  { point: "HOSPITAL", zone: "ABANDONED CITY", x: 1160, y: 870, color: 0x39455d },
  { point: "POLICE STATION", zone: "MILITARY ZONE", x: 1820, y: 590, color: 0x3a4250 },
  { point: "MILITARY CHECKPOINT", zone: "DEAD ZONE", x: 2010, y: 930, color: 0x4d2e2e },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function phaseFromClock(dayClock: number): DeadlandsDayPhase {
  const cycle = dayClock % DAY_LENGTH_SECONDS;
  if (cycle < 80) return "DAY";
  if (cycle < 130) return "EVENING";
  if (cycle < 200) return "NIGHT";
  return "DAWN";
}

function phaseTint(phase: DeadlandsDayPhase) {
  if (phase === "DAY") return 0.1;
  if (phase === "EVENING") return 0.24;
  if (phase === "NIGHT") return 0.48;
  return 0.2;
}

function randomRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function createDeadlandsRuntimeScene(Phaser: typeof import("phaser")) {
  return class DeadlandsRuntimeScene extends Phaser.Scene {
    private player!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private keys!: Record<string, Phaser.Input.Keyboard.Key>;
    private zombies: RuntimeZombie[] = [];
    private pickups: RuntimePickup[] = [];
    private resourceNodes: ResourceNode[] = [];
    private bullets!: Phaser.Physics.Arcade.Group;
    private overlay!: Phaser.GameObjects.Rectangle;
    private snapshot: DeadlandsSurvivalSnapshot = createInitialDeadlandsSnapshot();
    private lastShotAt = 0;
    private isReloading = false;
    private nextZombieId = 1;
    private nextPickupId = 1;
    private nextNodeId = 1;
    private lastPointerDown = false;
    private notificationsQueue: string[] = [];
    private lastSyncAt = 0;
    private spawnTimer?: Phaser.Time.TimerEvent;
    private tickTimer?: Phaser.Time.TimerEvent;
    private hordeTimer?: Phaser.Time.TimerEvent;
    private safeHousePosition = { x: 320, y: 320 };
    private barricades!: Phaser.GameObjects.Group;

    constructor() {
      super("DeadlandsRuntimeScene");
    }

    create() {
      this.snapshot = useDeadlandsStore.getState().snapshot;
      this.ensurePixelTexture();
      this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      this.cameras.main.setBackgroundColor("#090c10");
      this.cameras.main.setZoom(1);

      this.drawWorld();
      this.createPlayer();
      this.createNodes();
      this.createZombiePool();
      this.createUIOverlay();
      this.createInput();

      this.spawnTimer = this.time.addEvent({ delay: 2400, loop: true, callback: () => this.spawnZombieWave() });
      this.tickTimer = this.time.addEvent({ delay: 1000, loop: true, callback: () => this.onSecondTick() });
      this.hordeTimer = this.time.addEvent({ delay: 45000, loop: true, callback: () => this.triggerDynamicEvent() });

      useDeadlandsStore.getState().setRuntimeStatus("ready");
      this.pushNotification("Deadlands runtime online. Secure the safe house.");
      this.syncSnapshot(true);
    }

    private ensurePixelTexture() {
      if (this.textures.exists(PIXEL_TEXTURE_KEY)) {
        return;
      }

      const graphics = this.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(0xffffff, 1);
      graphics.fillRect(0, 0, 4, 4);
      graphics.generateTexture(PIXEL_TEXTURE_KEY, 4, 4);
      graphics.destroy();
    }

    update(_: number, delta: number) {
      this.processCommands();

      if (this.snapshot.gameOver) {
        this.player.setVelocity(0, 0);
        return;
      }

      this.updateMovement(delta);
      this.updateCombat();
      this.updateZombies();
      this.updateDayNightOverlay();
      this.updateInteractions();

      if (this.time.now - this.lastSyncAt > 160) {
        this.syncSnapshot();
      }
    }

    private drawWorld() {
      const background = this.add.graphics();
      background.fillStyle(0x10161c, 1);
      background.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      const grid = this.add.graphics({ lineStyle: { width: 1, color: 0x1c242d, alpha: 0.3 } });
      for (let x = 0; x <= WORLD_WIDTH; x += 64) {
        grid.lineBetween(x, 0, x, WORLD_HEIGHT);
      }
      for (let y = 0; y <= WORLD_HEIGHT; y += 64) {
        grid.lineBetween(0, y, WORLD_WIDTH, y);
      }

      for (const point of MAP_LAYOUT) {
        const pad = 180;
        const rect = this.add.rectangle(point.x, point.y, pad, 120, point.color, 0.85);
        rect.setStrokeStyle(2, 0x91a3af, 0.24);
        this.add.text(point.x - 68, point.y - 12, point.point, {
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: "16px",
          color: "#f4efe5",
        });
      }

      this.add.text(95, 95, "SAFE OUTSKIRTS", {
        fontFamily: "Space Grotesk, sans-serif",
        fontSize: "20px",
        color: "#7bc3b8",
      });
      this.add.text(760, 180, "INFESTED FOREST", {
        fontFamily: "Space Grotesk, sans-serif",
        fontSize: "20px",
        color: "#8bbf74",
      });
      this.add.text(1200, 210, "ABANDONED CITY", {
        fontFamily: "Space Grotesk, sans-serif",
        fontSize: "20px",
        color: "#f1c38c",
      });
      this.add.text(1680, 330, "MILITARY ZONE", {
        fontFamily: "Space Grotesk, sans-serif",
        fontSize: "20px",
        color: "#d6c4a0",
      });
      this.add.text(1860, 1120, "DEAD ZONE", {
        fontFamily: "Space Grotesk, sans-serif",
        fontSize: "20px",
        color: "#ff8e7b",
      });
    }

    private createPlayer() {
      this.player = this.physics.add.image(this.safeHousePosition.x, this.safeHousePosition.y, PIXEL_TEXTURE_KEY);
      this.player.setDisplaySize(30, 30);
      this.player.setCircle(15);
      this.player.setSize(30, 30);
      this.player.setCollideWorldBounds(true);
      this.player.setTint(0xd6c4a0);
      this.player.setDrag(560, 560);
      this.player.setMaxVelocity(PLAYER_SPRINT_SPEED, PLAYER_SPRINT_SPEED);

      const marker = this.add.circle(this.safeHousePosition.x, this.safeHousePosition.y, 38, 0x4eb1a8, 0.08);
      marker.setStrokeStyle(2, 0x4eb1a8, 0.35);

      this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

      this.bullets = this.physics.add.group({ maxSize: 40, runChildUpdate: false });
      this.barricades = this.add.group();
    }

    private createNodes() {
      const nodeRewards: Record<DeadlandsMapPoint, Array<DeadlandsInventoryItem>> = {
        "SAFE HOUSE": [DEADLANDS_ITEM_REWARDS.CLEAN_WATER],
        "ABANDONED ROAD": [{ id: "RAG", name: "Rag", description: "Field fabric.", type: "MATERIAL", rarity: "COMMON", quantity: 2, maxStack: 12, weight: 0.15, value: 4 }],
        "FOREST": [{ id: "WOOD", name: "Wood", description: "Raw wood for crafting.", type: "MATERIAL", rarity: "COMMON", quantity: 2, maxStack: 12, weight: 0.4, value: 5 }],
        "GAS STATION": [{ id: "DIRTY_WATER", name: "Dirty Water", description: "Cloudy but usable.", type: "WATER", rarity: "COMMON", quantity: 2, maxStack: 6, weight: 0.5, value: 10 }],
        "WAREHOUSE": [{ id: "SCRAP_METAL", name: "Scrap Metal", description: "Useful salvage.", type: "MATERIAL", rarity: "COMMON", quantity: 2, maxStack: 12, weight: 0.35, value: 6 }],
        "HOSPITAL": [{ id: "BANDAGE", name: "Bandage", description: "Restores health.", type: "MEDICAL", rarity: "COMMON", quantity: 1, maxStack: 6, weight: 0.1, value: 18 }],
        "POLICE STATION": [{ id: "LIGHT_AMMO", name: "Light Ammo", description: "Compact rounds.", type: "AMMO", rarity: "UNCOMMON", quantity: 10, maxStack: 60, weight: 0.03, value: 2 }],
        "MILITARY CHECKPOINT": [{ id: "FIELD_KIT", name: "Field Kit", description: "Rare survival cache.", type: "TOOL", rarity: "RARE", quantity: 1, maxStack: 1, weight: 0.9, value: 90 }],
      };

      for (const point of MAP_LAYOUT) {
        const node = this.add.rectangle(point.x + 48, point.y + 30, 28, 28, 0xd6c4a0, 0.85);
        node.setStrokeStyle(2, 0xffffff, 0.22);
        const label = this.add.text(point.x + 28, point.y + 48, "SCAVENGE [E]", {
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: "12px",
          color: "#f4efe5",
        });

        this.resourceNodes.push({
          id: this.nextNodeId++,
          point: point.point,
          body: node,
          rewardPool: nodeRewards[point.point].map((item) => ({ ...item })),
          label,
          consumed: false,
        });
      }
    }

    private createZombiePool() {
      for (let index = 0; index < 4; index += 1) {
        this.spawnZombie(["NORMAL_ZOMBIE", "RUNNER", "BRUTE", "SCREAMER"][index] as DeadlandsEnemyKind);
      }
    }

    private createUIOverlay() {
      this.overlay = this.add.rectangle(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 0x08101a, 0.12).setOrigin(0, 0);
      this.overlay.setScrollFactor(1, 1);
      this.overlay.setDepth(1000);
    }

    private createInput() {
      this.cursors = this.input.keyboard?.createCursorKeys() as Phaser.Types.Input.Keyboard.CursorKeys;
      this.keys = this.input.keyboard?.addKeys({
        up: "W",
        down: "S",
        left: "A",
        right: "D",
        sprint: Phaser.Input.Keyboard.KeyCodes.SHIFT,
        interact: Phaser.Input.Keyboard.KeyCodes.E,
        melee: Phaser.Input.Keyboard.KeyCodes.SPACE,
        reload: Phaser.Input.Keyboard.KeyCodes.R,
      }) as Record<string, Phaser.Input.Keyboard.Key>;

      this.input.on("pointerdown", () => {
        this.lastPointerDown = true;
      });
    }

    private updateMovement(delta: number) {
      const isSprinting = this.keys.sprint.isDown && this.snapshot.stamina > 5;
      const speed = isSprinting ? PLAYER_SPRINT_SPEED : PLAYER_SPEED;
      let vx = 0;
      let vy = 0;

      if (this.keys.left.isDown || this.cursors.left.isDown) vx -= speed;
      if (this.keys.right.isDown || this.cursors.right.isDown) vx += speed;
      if (this.keys.up.isDown || this.cursors.up.isDown) vy -= speed;
      if (this.keys.down.isDown || this.cursors.down.isDown) vy += speed;

      const moving = vx !== 0 || vy !== 0;
      if (moving) {
        const length = Math.hypot(vx, vy) || 1;
        vx = (vx / length) * speed;
        vy = (vy / length) * speed;
        this.player.setVelocity(vx, vy);
        this.snapshot.distanceTraveled += (speed * delta) / 1000 / 10;
      } else {
        this.player.setVelocity(0, 0);
      }

      if (moving && isSprinting) {
        this.snapshot.stamina = clamp(this.snapshot.stamina - delta * 0.018, 0, this.snapshot.maxStamina);
      } else {
        this.snapshot.stamina = clamp(this.snapshot.stamina + delta * 0.012, 0, this.snapshot.maxStamina);
      }

      const currentPoint = this.findNearestMapPoint();
      this.snapshot.mapPoint = currentPoint.point;
      this.snapshot.zone = currentPoint.zone;
    }

    private updateCombat() {
      if (Phaser.Input.Keyboard.JustDown(this.keys.reload)) {
        this.reloadWeapon();
      }

      if (Phaser.Input.Keyboard.JustDown(this.keys.melee)) {
        this.performMelee();
      }

      const pointer = this.input.activePointer;
      if ((pointer.isDown || this.lastPointerDown) && !this.isReloading) {
        this.tryShoot(pointer.worldX, pointer.worldY);
      }
      this.lastPointerDown = false;
    }

    private updateZombies() {
      for (const zombie of this.zombies) {
        if (!zombie.body.active) {
          continue;
        }

        const distance = Phaser.Math.Distance.Between(zombie.body.x, zombie.body.y, this.player.x, this.player.y);
        if (distance < zombie.aggro) {
          zombie.state = distance < 34 ? "ATTACK" : "CHASE";
        } else {
          zombie.state = "WANDER";
        }

        if (zombie.state === "CHASE") {
          this.physics.moveToObject(zombie.body, this.player, zombie.speed * (this.snapshot.dayPhase === "NIGHT" ? 1.18 : 1));
        } else if (zombie.state === "ATTACK") {
          zombie.body.setVelocity(0, 0);
          if (this.time.now >= zombie.nextAttackAt) {
            zombie.nextAttackAt = this.time.now + 900;
            this.applyDamage(zombie.damage);
            if (zombie.kind === "SCREAMER") {
              this.spawnZombieWave(2);
              this.pushNotification("A Screamer attracted more infected.");
            }
          }
        } else {
          const angle = zombie.wanderAngle;
          zombie.body.setVelocity(Math.cos(angle) * zombie.speed * 0.4, Math.sin(angle) * zombie.speed * 0.4);
          zombie.wanderAngle += 0.015;
        }
      }

      this.snapshot.activeZombieCount = this.zombies.filter((zombie) => zombie.body.active).length;
    }

    private updateDayNightOverlay() {
      this.overlay.setFillStyle(0x08101a, phaseTint(this.snapshot.dayPhase));
    }

    private updateInteractions() {
      if (!Phaser.Input.Keyboard.JustDown(this.keys.interact)) {
        return;
      }

      const pickup = this.pickups.find((entry) => entry.body.active && Phaser.Math.Distance.Between(entry.body.x, entry.body.y, this.player.x, this.player.y) < INTERACT_RANGE);
      if (pickup) {
        this.snapshot.inventory = addInventoryItem(this.snapshot.inventory, pickup.reward);
        pickup.body.destroy();
        this.pickups = this.pickups.filter((entry) => entry.id !== pickup.id);
        this.pushNotification(`Collected ${pickup.reward.name}.`);
        this.incrementQuest("SCAVENGE_STARTER", pickup.reward.quantity);
        return;
      }

      const node = this.resourceNodes.find((entry) => !entry.consumed && Phaser.Math.Distance.Between(entry.body.x, entry.body.y, this.player.x, this.player.y) < INTERACT_RANGE);
      if (node) {
        node.consumed = true;
        node.body.setFillStyle(0x37414c, 0.45);
        node.label.setText("DEPLETED");
        for (const reward of node.rewardPool) {
          this.snapshot.inventory = addInventoryItem(this.snapshot.inventory, reward);
          this.incrementQuest("SCAVENGE_STARTER", reward.quantity);
        }
        this.pushNotification(`${node.point} searched.`);
      }
    }

    private tryShoot(targetX: number, targetY: number) {
      const weapon = DEADLANDS_WEAPONS[this.snapshot.currentWeaponId];
      if (!weapon.ammoType || this.time.now - this.lastShotAt < weapon.fireRateMs) {
        return;
      }

      const reserve = this.snapshot.ammoReserve[weapon.ammoType];
      const magazineItem = this.snapshot.inventory.find((item) => item.id === weapon.id);
      if (!magazineItem && reserve <= 0) {
        this.pushNotification("Out of ammo. Search or craft more.");
        return;
      }

      if (reserve <= 0) {
        this.pushNotification("Magazine empty. Reload required.");
        return;
      }

      this.lastShotAt = this.time.now;
      this.snapshot.ammoReserve[weapon.ammoType] = Math.max(0, reserve - 1);
      const bullet = this.physics.add.image(this.player.x, this.player.y, PIXEL_TEXTURE_KEY);
      bullet.setDisplaySize(8, 8);
      bullet.setCircle(4);
      bullet.setTint(0xf6d365);
      bullet.setSize(8, 8);
      const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, targetX, targetY);
      bullet.setVelocity(Math.cos(angle) * BULLET_SPEED, Math.sin(angle) * BULLET_SPEED);
      this.bullets.add(bullet);
      this.cameras.main.shake(35, 0.0025);

      for (const zombie of this.zombies) {
        if (!zombie.body.active) continue;
        const distance = Phaser.Math.Distance.Between(targetX, targetY, zombie.body.x, zombie.body.y);
        if (distance < 42) {
          this.damageZombie(zombie, weapon.damage);
          bullet.destroy();
          break;
        }
      }

      this.time.delayedCall(800, () => {
        if (bullet.active) {
          bullet.destroy();
        }
      });
    }

    private performMelee() {
      const weapon = DEADLANDS_WEAPONS.SCRAP_AXE;
      if (this.snapshot.stamina < (weapon.staminaCost ?? 10)) {
        this.pushNotification("Too exhausted for melee.");
        return;
      }

      this.snapshot.stamina = clamp(this.snapshot.stamina - (weapon.staminaCost ?? 10), 0, this.snapshot.maxStamina);
      this.cameras.main.shake(50, 0.002);

      for (const zombie of this.zombies) {
        if (!zombie.body.active) continue;
        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, zombie.body.x, zombie.body.y);
        if (distance < weapon.range) {
          this.damageZombie(zombie, weapon.damage);
        }
      }
    }

    private reloadWeapon() {
      const weapon = DEADLANDS_WEAPONS[this.snapshot.currentWeaponId];
      if (!weapon.ammoType || this.isReloading) {
        return;
      }

      if (this.snapshot.ammoReserve[weapon.ammoType] <= 0) {
        this.pushNotification("No reserve ammo to reload.");
        return;
      }

      this.isReloading = true;
      this.pushNotification("Reloading...");
      this.time.delayedCall(weapon.reloadTimeMs, () => {
        this.isReloading = false;
        this.pushNotification("Weapon ready.");
      });
    }

    private damageZombie(zombie: RuntimeZombie, amount: number) {
      zombie.hp -= amount;
      zombie.body.setTintFill(0xffffff);
      this.time.delayedCall(80, () => zombie.body.clearTint());

      if (zombie.hp <= 0) {
        zombie.body.disableBody(true, true);
        this.snapshot.kills += 1;
        this.snapshot.xp += DEADLANDS_ENEMY_TEMPLATES[zombie.kind].xp;
        this.snapshot.currency += 6 + Math.floor(Math.random() * 8);
        this.incrementQuest("FIRST_BLOOD", 1);
        this.pushNotification(`${zombie.kind.replaceAll("_", " ")} neutralized.`);
        this.tryLevelUp();
        this.spawnPickup(zombie.body.x, zombie.body.y);
        if (zombie.kind === "BOSS_ZOMBIE" && !this.snapshot.achievements.includes("ZOMBIE_SLAYER")) {
          this.snapshot.achievements.push("ZOMBIE_SLAYER");
        }
      }
    }

    private spawnPickup(x: number, y: number) {
      const rewardOptions: DeadlandsInventoryItem[] = [
        { id: "RAG", name: "Rag", description: "Fabric scrap.", type: "MATERIAL", rarity: "COMMON", quantity: 1, maxStack: 12, weight: 0.15, value: 4 },
        { id: "LIGHT_AMMO", name: "Light Ammo", description: "Compact rounds.", type: "AMMO", rarity: "COMMON", quantity: 5, maxStack: 60, weight: 0.03, value: 2 },
        { id: "CANNED_BEANS", name: "Canned Beans", description: "Calories in a can.", type: "FOOD", rarity: "COMMON", quantity: 1, maxStack: 6, weight: 0.4, value: 12 },
      ];

      const reward = { ...rewardOptions[Math.floor(Math.random() * rewardOptions.length)] };
      const body = this.physics.add.image(x, y, PIXEL_TEXTURE_KEY);
      body.setDisplaySize(16, 16);
      body.setCircle(8);
      body.setTint(0xf4efe5);
      body.setSize(16, 16);
      body.setImmovable(true);
      body.setVelocity(0, 0);
      this.pickups.push({ id: this.nextPickupId++, label: reward.name, body, reward });
    }

    private spawnZombieWave(multiplier = 1) {
      const baseCount = this.snapshot.dayPhase === "NIGHT" ? 3 : 2;
      const total = baseCount * multiplier;
      for (let index = 0; index < total; index += 1) {
        this.spawnZombie();
      }
    }

    private spawnZombie(kind?: DeadlandsEnemyKind) {
      const zoneDifficulty = DEADLANDS_ZONES.find((zone) => zone.key === this.snapshot.zone)?.difficulty ?? 1;
      const phase = this.snapshot.dayPhase;
      const roll = Math.random();
      let selected: DeadlandsEnemyKind = kind || "NORMAL_ZOMBIE";

      if (!kind) {
        if (zoneDifficulty >= 4 && phase === "NIGHT" && roll > 0.94) selected = "BOSS_ZOMBIE";
        else if (roll > 0.82) selected = "BRUTE";
        else if (roll > 0.66) selected = "SCREAMER";
        else if (roll > 0.4 || phase === "NIGHT") selected = "RUNNER";
      }

      const template = DEADLANDS_ENEMY_TEMPLATES[selected];
      const spawnX = clamp(this.player.x + randomRange(-300, 300), 80, WORLD_WIDTH - 80);
      const spawnY = clamp(this.player.y + randomRange(-250, 250), 80, WORLD_HEIGHT - 80);
      const radius = selected === "BRUTE" ? 18 : selected === "BOSS_ZOMBIE" ? 22 : 14;
      const body = this.physics.add.image(spawnX, spawnY, PIXEL_TEXTURE_KEY);
      body.setDisplaySize(radius * 2, radius * 2);
      body.setCircle(radius);
      body.setTint(template.color);
      body.setCollideWorldBounds(true);
      body.setDrag(260, 260);

      this.zombies.push({
        id: this.nextZombieId++,
        kind: selected,
        hp: template.hp,
        maxHp: template.hp,
        speed: template.speed,
        damage: template.damage,
        aggro: template.aggro,
        state: "WANDER",
        body,
        nextAttackAt: 0,
        wanderAngle: Math.random() * Math.PI * 2,
      });
    }

    private onSecondTick() {
      this.snapshot.dayClock += 1;
      this.snapshot.dayPhase = phaseFromClock(this.snapshot.dayClock);
      this.snapshot.survivalDays = 1 + Math.floor(this.snapshot.dayClock / DAY_LENGTH_SECONDS);
      this.snapshot.hunger = clamp(this.snapshot.hunger - (this.snapshot.mode === "SURVIVAL" ? 0.65 : 0.45), 0, 100);
      this.snapshot.thirst = clamp(this.snapshot.thirst - (this.snapshot.mode === "SURVIVAL" ? 0.9 : 0.55), 0, 100);
      this.snapshot.temperature = this.snapshot.dayPhase === "NIGHT" ? 34.6 : this.snapshot.dayPhase === "DAY" ? 37.1 : 36;

      if (this.snapshot.hunger <= 0 || this.snapshot.thirst <= 0) {
        this.applyDamage(this.snapshot.mode === "SURVIVAL" ? 4 : 2);
      }

      if (this.snapshot.dayPhase === "DAWN") {
        this.incrementQuest("SURVIVE_NIGHT", 1, true);
      }

      if (this.snapshot.dayPhase === "NIGHT") {
        this.snapshot.eventLabel = "Night pressure rising. Infected are faster and more aggressive.";
      } else if (this.snapshot.dayPhase === "DAY") {
        this.snapshot.eventLabel = "Daylight grants visibility, but supplies are still scarce.";
      }
    }

    private triggerDynamicEvent() {
      if (this.snapshot.gameOver) {
        return;
      }

      if (this.snapshot.dayPhase === "NIGHT") {
        this.pushNotification("Zombie Horde incoming.");
        this.snapshot.eventLabel = "Zombie Horde detected near the safe house.";
        this.spawnZombieWave(3);
        return;
      }

      this.pushNotification("Supply Drop signal captured.");
      this.snapshot.eventLabel = "A supply drop landed near the warehouse.";
      this.spawnPickup(1510 + randomRange(-40, 40), 690 + randomRange(-40, 40));
    }

    private processCommands() {
      const commands = useDeadlandsStore.getState().drainCommands();
      for (const command of commands) {
        this.handleCommand(command);
      }
    }

    private handleCommand(command: DeadlandsCommand) {
      if (command.type === "CHANGE_MODE") {
        this.restartWithMode((command.payload as DeadlandsMode) || "NORMAL");
        return;
      }

      if (command.type === "TRAVEL_ZONE") {
        const zone = command.payload as DeadlandsZone | undefined;
        if (!zone) return;
        const point = MAP_LAYOUT.find((entry) => entry.zone === zone) ?? MAP_LAYOUT[0];
        this.player.setPosition(point.x, point.y);
        this.snapshot.zone = zone;
        this.snapshot.mapPoint = point.point;
        this.pushNotification(`Moved to ${zone}.`);
        return;
      }

      if (command.type === "TRAVEL_POINT") {
        const pointKey = command.payload as DeadlandsMapPoint | undefined;
        if (!pointKey) return;
        const point = MAP_LAYOUT.find((entry) => entry.point === pointKey);
        if (!point) return;
        this.player.setPosition(point.x, point.y);
        this.snapshot.zone = point.zone;
        this.snapshot.mapPoint = point.point;
        this.pushNotification(`Entered ${point.point}.`);
        return;
      }

      if (command.type === "CRAFT_BANDAGE") {
        const crafted = craftInventory(this.snapshot.inventory, "CRAFT_BANDAGE");
        if (!crafted) {
          this.pushNotification("Need 2 Rags to craft a Bandage.");
          return;
        }
        this.snapshot.inventory = crafted;
        this.snapshot.xp += 10;
        this.pushNotification("Crafted Bandage.");
        return;
      }

      if (command.type === "CRAFT_LIGHT_AMMO") {
        const crafted = craftInventory(this.snapshot.inventory, "CRAFT_LIGHT_AMMO");
        if (!crafted) {
          this.pushNotification("Need Scrap Metal and Rag to craft Light Ammo.");
          return;
        }
        this.snapshot.inventory = crafted;
        this.snapshot.xp += 12;
        this.pushNotification("Crafted Light Ammo.");
        return;
      }

      if (command.type === "CRAFT_WATER") {
        const crafted = craftInventory(this.snapshot.inventory, "CRAFT_WATER");
        if (!crafted) {
          this.pushNotification("Need Dirty Water to purify.");
          return;
        }
        this.snapshot.inventory = crafted;
        this.snapshot.xp += 8;
        this.pushNotification("Purified water.");
        return;
      }

      if (command.type === "BUILD_BARRICADE") {
        if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.safeHousePosition.x, this.safeHousePosition.y) > 220) {
          this.pushNotification("Return to the Safe House to build defenses.");
          return;
        }

        const consumed = consumeInventoryItems(this.snapshot.inventory, [
          { id: "SCRAP_METAL", amount: 2 },
          { id: "RAG", amount: 1 },
        ]);
        if (!consumed) {
          this.pushNotification("Need 2 Scrap Metal and 1 Rag for a barricade.");
          return;
        }

        this.snapshot.inventory = consumed;
        this.snapshot.shelterBarricades += 1;
        if (this.snapshot.shelterBarricades >= 3) {
          this.snapshot.shelterLevel = 2;
          this.incrementQuest("FORTIFY_HOME", 3, true);
        } else {
          this.incrementQuest("FORTIFY_HOME", 1);
        }
        const angle = this.snapshot.shelterBarricades * 1.2;
        const x = this.safeHousePosition.x + Math.cos(angle) * 78;
        const y = this.safeHousePosition.y + Math.sin(angle) * 78;
        const barricade = this.add.rectangle(x, y, 34, 16, 0x70513d, 0.95);
        barricade.setStrokeStyle(2, 0xd6c4a0, 0.4);
        this.barricades.add(barricade);
        this.pushNotification("Barricade placed.");
        return;
      }

      if (command.type === "USE_BANDAGE") {
        this.useInventoryItem("BANDAGE", () => {
          this.snapshot.health = clamp(this.snapshot.health + 28, 0, this.snapshot.maxHealth);
          this.pushNotification("Bandage applied.");
        });
        return;
      }

      if (command.type === "USE_WATER") {
        this.useInventoryItem(countInventoryItem(this.snapshot.inventory, "CLEAN_WATER") > 0 ? "CLEAN_WATER" : "DIRTY_WATER", () => {
          this.snapshot.thirst = clamp(this.snapshot.thirst + 34, 0, 100);
          this.pushNotification("Water consumed.");
        });
        return;
      }

      if (command.type === "USE_FOOD") {
        this.useInventoryItem("CANNED_BEANS", () => {
          this.snapshot.hunger = clamp(this.snapshot.hunger + 28, 0, 100);
          this.pushNotification("Food consumed.");
        });
        return;
      }

      if (command.type === "RESTART") {
        this.restartWithMode(this.snapshot.mode);
      }
    }

    private useInventoryItem(itemId: string, onUse: () => void) {
      const consumed = consumeInventoryItems(this.snapshot.inventory, [{ id: itemId, amount: 1 }]);
      if (!consumed) {
        this.pushNotification(`Missing ${itemId.replaceAll("_", " ")}.`);
        return;
      }

      this.snapshot.inventory = consumed;
      onUse();
    }

    private restartWithMode(mode: DeadlandsMode) {
      this.snapshot = createInitialDeadlandsSnapshot(mode);
      this.player.setPosition(this.safeHousePosition.x, this.safeHousePosition.y);
      for (const zombie of this.zombies) {
        zombie.body.destroy();
      }
      this.zombies = [];
      for (const pickup of this.pickups) {
        pickup.body.destroy();
      }
      this.pickups = [];
      this.barricades.clear(true, true);
      for (const node of this.resourceNodes) {
        node.consumed = false;
        node.body.setFillStyle(0xd6c4a0, 0.85);
        node.label.setText("SCAVENGE [E]");
      }
      this.createZombiePool();
      this.pushNotification(`Restarted in ${mode} mode.`);
      this.syncSnapshot(true);
    }

    private applyDamage(amount: number) {
      this.snapshot.health = clamp(this.snapshot.health - amount, 0, this.snapshot.maxHealth);
      this.player.setTint(0xff8e7b);
      this.time.delayedCall(90, () => this.player.setTint(0xd6c4a0));
      if (this.snapshot.health <= 0 && !this.snapshot.gameOver) {
        this.snapshot.gameOver = true;
        this.snapshot.deaths += 1;
        this.snapshot.eventLabel = "YOU DIED";
        this.pushNotification("You died. Respawn to continue the run.");
      }
    }

    private incrementQuest(key: string, amount: number, forceComplete = false) {
      this.snapshot.quests = this.snapshot.quests.map((quest) => {
        if (quest.key !== key || quest.completed) {
          return quest;
        }

        const progress = forceComplete ? quest.target : clamp(quest.progress + amount, 0, quest.target);
        const completed = progress >= quest.target;
        if (completed) {
          this.snapshot.xp += 25;
          this.snapshot.currency += 15;
        }
        return { ...quest, progress, completed };
      });
    }

    private tryLevelUp() {
      const nextLevelThreshold = this.snapshot.level * 120;
      if (this.snapshot.xp < nextLevelThreshold) {
        return;
      }

      this.snapshot.level += 1;
      this.snapshot.skillPoints += 1;
      this.snapshot.maxHealth += 8;
      this.snapshot.health = this.snapshot.maxHealth;
      this.pushNotification(`Level ${this.snapshot.level} reached.`);
    }

    private findNearestMapPoint() {
      return MAP_LAYOUT.reduce<{
        point: DeadlandsMapPoint;
        zone: DeadlandsZone;
        x: number;
        y: number;
        color: number;
        distance: number;
      }>(
        (best, point) => {
          const distance = Phaser.Math.Distance.Between(point.x, point.y, this.player.x, this.player.y);
          if (distance < best.distance) {
            return { ...point, distance };
          }
          return best;
        },
        { ...MAP_LAYOUT[0], distance: Number.POSITIVE_INFINITY }
      );
    }

    private pushNotification(message: string) {
      this.notificationsQueue = [message, ...this.notificationsQueue].slice(0, 6);
      this.snapshot.notifications = [...this.notificationsQueue];
      this.lastSyncAt = 0;
    }

    private syncSnapshot(force = false) {
      const weight = calculateInventoryWeight(this.snapshot.inventory);
      const overloaded = weight > INVENTORY_WEIGHT_LIMIT;
      const next = {
        ...this.snapshot,
        eventLabel: overloaded ? `${this.snapshot.eventLabel} Carry load high: ${weight.toFixed(1)}/${INVENTORY_WEIGHT_LIMIT}` : this.snapshot.eventLabel,
        notifications: [...this.snapshot.notifications],
        inventory: this.snapshot.inventory.map((item) => ({ ...item })),
        quests: this.snapshot.quests.map((quest) => ({ ...quest })),
        achievements: [...this.snapshot.achievements],
        activeZombieCount: this.snapshot.activeZombieCount,
      } satisfies DeadlandsSurvivalSnapshot;

      useDeadlandsStore.getState().hydrateSnapshot(next);
      if (force) {
        this.lastSyncAt = this.time.now;
      } else {
        this.lastSyncAt = this.time.now;
      }
    }
  };
}
