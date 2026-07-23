"use client";

import { BrowserProvider } from "ethers";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Vec2 = { x: number; y: number };

type EnemyKind = "SCOUT" | "BRUTE" | "LEECH";

type EnemyTemplate = {
  kind: EnemyKind;
  hp: number;
  speed: number;
  radius: number;
  touchDamage: number;
  scoreValue: number;
  coinMin: number;
  coinMax: number;
  color: string;
};

type Enemy = {
  id: number;
  kind: EnemyKind;
  pos: Vec2;
  hp: number;
  speed: number;
  radius: number;
  touchDamage: number;
  scoreValue: number;
  coinMin: number;
  coinMax: number;
  skinColor: string;
  outfitColor: string;
  accentColor: string;
  headScale: number;
  torsoScale: number;
  armScale: number;
  legScale: number;
  animSeed: number;
};

type Bullet = {
  id: number;
  pos: Vec2;
  vel: Vec2;
  radius: number;
  damage: number;
};

type ArenaState = {
  player: Vec2;
  hp: number;
  maxHp: number;
  score: number;
  wave: number;
  time: number;
  coins: number;
  damage: number;
  upgradeTokens: number;
  running: boolean;
  paused: boolean;
};

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

const WIDTH = 900;
const HEIGHT = 460;
const PLAYER_RADIUS = 14;
const PLAYER_SPEED = 220;
const SPAWN_EVERY_MS = 780;
const SHOOT_EVERY_MS = 230;
const UPGRADE_INTERVAL_SECONDS = 120;
const CLAIM_SCORE_TARGET = 2000;

const ENEMY_POOL: EnemyTemplate[] = [
  {
    kind: "SCOUT",
    hp: 16,
    speed: 70,
    radius: 10,
    touchDamage: 10,
    scoreValue: 60,
    coinMin: 4,
    coinMax: 8,
    color: "#ff8f8f",
  },
  {
    kind: "BRUTE",
    hp: 34,
    speed: 42,
    radius: 14,
    touchDamage: 18,
    scoreValue: 90,
    coinMin: 10,
    coinMax: 18,
    color: "#ffd166",
  },
  {
    kind: "LEECH",
    hp: 22,
    speed: 56,
    radius: 11,
    touchDamage: 14,
    scoreValue: 75,
    coinMin: 6,
    coinMax: 12,
    color: "#8ecae6",
  },
];

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function buildHumanoidStyle() {
  const skinHue = randomBetween(22, 42);
  const outfitHue = randomBetween(0, 360);
  const accentHue = (outfitHue + randomBetween(35, 120)) % 360;
  return {
    skinColor: `hsl(${skinHue} 48% ${randomBetween(56, 70)}%)`,
    outfitColor: `hsl(${outfitHue} ${randomBetween(45, 80)}% ${randomBetween(40, 60)}%)`,
    accentColor: `hsl(${accentHue} ${randomBetween(55, 88)}% ${randomBetween(42, 66)}%)`,
    headScale: randomFloat(0.85, 1.2),
    torsoScale: randomFloat(0.85, 1.35),
    armScale: randomFloat(0.8, 1.25),
    legScale: randomFloat(0.9, 1.35),
    animSeed: randomFloat(0, Math.PI * 2),
  };
}

function pickEnemyTemplate(wave: number): EnemyTemplate {
  const roll = Math.random();
  if (wave >= 5 && roll > 0.62) return ENEMY_POOL[1];
  if (wave >= 3 && roll > 0.35) return ENEMY_POOL[2];
  return ENEMY_POOL[0];
}

function createArenaStartState(): ArenaState {
  return {
    player: { x: WIDTH / 2, y: HEIGHT / 2 },
    hp: 100,
    maxHp: 100,
    score: 0,
    wave: 1,
    time: 0,
    coins: 0,
    damage: 9,
    upgradeTokens: 0,
    running: false,
    paused: false,
  };
}

export function Web3Arena() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loopRef = useRef<number | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const playerRenderRef = useRef<Vec2>({ x: WIDTH / 2, y: HEIGHT / 2 });
  const nextEnemyIdRef = useRef(1);
  const nextBulletIdRef = useRef(1);
  const lastSpawnRef = useRef(0);
  const lastShootRef = useRef(0);
  const lastTickRef = useRef(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicTimerRef = useRef<number | null>(null);
  const musicStepRef = useRef(0);

  const [arena, setArena] = useState<ArenaState>(createArenaStartState());
  const [wallet, setWallet] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string>("-");
  const [menuOpen, setMenuOpen] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const [claimStatus, setClaimStatus] = useState(
    "Connect wallet and survive to claim Web3 payload."
  );

  const shouldReduceMotion = useReducedMotion();

  const canClaim = useMemo(
    () => arena.score >= CLAIM_SCORE_TARGET && Boolean(wallet),
    [arena.score, wallet]
  );

  function stopLoop() {
    if (loopRef.current !== null) {
      cancelAnimationFrame(loopRef.current);
      loopRef.current = null;
    }
  }

  const stopMusic = useCallback(() => {
    if (musicTimerRef.current !== null) {
      window.clearInterval(musicTimerRef.current);
      musicTimerRef.current = null;
    }
    if (audioCtxRef.current) {
      void audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  }, []);

  const playTone = useCallback((ctx: AudioContext, frequency: number, durationMs: number, volume: number) => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    osc.frequency.value = frequency;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + durationMs / 1000 + 0.02);
  }, []);

  const startMusic = useCallback(() => {
    if (audioCtxRef.current) return;

    const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    audioCtxRef.current = ctx;

    const melody = [
      523.25, 659.25, 783.99, 659.25,
      493.88, 587.33, 698.46, 587.33,
      440.0, 523.25, 659.25, 523.25,
      493.88, 587.33, 659.25, 698.46,
    ];

    musicStepRef.current = 0;
    musicTimerRef.current = window.setInterval(() => {
      const step = musicStepRef.current % melody.length;
      const note = melody[step];
      const bass = melody[(step + 8) % melody.length] / 2;
      playTone(ctx, note, 130, 0.028);
      if (step % 2 === 0) {
        playTone(ctx, bass, 160, 0.02);
      }
      musicStepRef.current += 1;
    }, 170);
  }, [playTone]);

  function resetGame() {
    enemiesRef.current = [];
    bulletsRef.current = [];
    nextEnemyIdRef.current = 1;
    nextBulletIdRef.current = 1;
    lastSpawnRef.current = 0;
    lastShootRef.current = 0;
    lastTickRef.current = 0;

    const startState = createArenaStartState();
    startState.running = true;

    setArena(startState);
    setMenuOpen(false);
    playerRenderRef.current = { ...startState.player };
    setClaimStatus("Survive and earn upgrades every 120 seconds.");

    startMusic();
  }

  useEffect(() => {
    const onDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (key === "escape") {
        setMenuOpen((prev) => {
          const next = !prev;
          setArena((current) => ({ ...current, paused: next }));
          return next;
        });
        return;
      }

      keysRef.current[key] = true;
    };

    const onUp = (event: KeyboardEvent) => {
      keysRef.current[event.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);

    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      stopLoop();
      stopMusic();
    };
  }, [stopMusic]);

  useEffect(() => {
    if (!musicOn) {
      stopMusic();
      return;
    }

    if (musicOn && arena.running && !arena.paused) {
      startMusic();
    }
  }, [arena.running, arena.paused, musicOn, startMusic, stopMusic]);

  useEffect(() => {
    if (!arena.running) {
      stopLoop();
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

    const spawnEnemy = (now: number, wave: number) => {
      if (now - lastSpawnRef.current < SPAWN_EVERY_MS) return;
      lastSpawnRef.current = now;

      const side = Math.floor(Math.random() * 4);
      const pad = 20;
      let x = 0;
      let y = 0;

      if (side === 0) {
        x = -pad;
        y = Math.random() * HEIGHT;
      } else if (side === 1) {
        x = WIDTH + pad;
        y = Math.random() * HEIGHT;
      } else if (side === 2) {
        x = Math.random() * WIDTH;
        y = -pad;
      } else {
        x = Math.random() * WIDTH;
        y = HEIGHT + pad;
      }

      const template = pickEnemyTemplate(wave);
      const scaling = 1 + (wave - 1) * 0.09;
      const style = buildHumanoidStyle();

      enemiesRef.current.push({
        id: nextEnemyIdRef.current++,
        kind: template.kind,
        pos: { x, y },
        hp: Math.floor(template.hp * scaling),
        speed: template.speed * (1 + (wave - 1) * 0.03),
        radius: template.radius,
        touchDamage: template.touchDamage * (1 + (wave - 1) * 0.04),
        scoreValue: template.scoreValue,
        coinMin: template.coinMin,
        coinMax: template.coinMax,
        skinColor: style.skinColor,
        outfitColor: style.outfitColor,
        accentColor: style.accentColor,
        headScale: style.headScale,
        torsoScale: style.torsoScale,
        armScale: style.armScale,
        legScale: style.legScale,
        animSeed: style.animSeed,
      });
    };

    const shoot = (now: number, playerPos: Vec2, bulletDamage: number) => {
      if (now - lastShootRef.current < SHOOT_EVERY_MS) return;
      if (enemiesRef.current.length === 0) return;
      lastShootRef.current = now;

      let nearest = enemiesRef.current[0];
      let nearestDist = Number.POSITIVE_INFINITY;

      for (const enemy of enemiesRef.current) {
        const dx = enemy.pos.x - playerPos.x;
        const dy = enemy.pos.y - playerPos.y;
        const dist = dx * dx + dy * dy;
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = enemy;
        }
      }

      const dx = nearest.pos.x - playerPos.x;
      const dy = nearest.pos.y - playerPos.y;
      const mag = Math.hypot(dx, dy) || 1;

      bulletsRef.current.push({
        id: nextBulletIdRef.current++,
        pos: { ...playerPos },
        vel: { x: (dx / mag) * 360, y: (dy / mag) * 360 },
        radius: 4,
        damage: bulletDamage,
      });
    };

    const tick = (now: number) => {
      if (!arena.running) return;

      if (!lastTickRef.current) {
        lastTickRef.current = now;
      }

      const delta = Math.min(0.033, (now - lastTickRef.current) / 1000);
      lastTickRef.current = now;

      setArena((previous) => {
        if (!previous.running) return previous;
        if (previous.paused) return previous;

        let px = previous.player.x;
        let py = previous.player.y;

        const keys = keysRef.current;
        const vx = (keys["d"] || keys["arrowright"] ? 1 : 0) - (keys["a"] || keys["arrowleft"] ? 1 : 0);
        const vy = (keys["s"] || keys["arrowdown"] ? 1 : 0) - (keys["w"] || keys["arrowup"] ? 1 : 0);
        const moveMag = Math.hypot(vx, vy);

        if (moveMag > 0) {
          px += (vx / moveMag) * PLAYER_SPEED * delta;
          py += (vy / moveMag) * PLAYER_SPEED * delta;
        }

        px = clamp(px, PLAYER_RADIUS, WIDTH - PLAYER_RADIUS);
        py = clamp(py, PLAYER_RADIUS, HEIGHT - PLAYER_RADIUS);

        const playerPos = { x: px, y: py };

        spawnEnemy(now, previous.wave);
        shoot(now, playerPos, previous.damage);

        enemiesRef.current = enemiesRef.current.map((enemy) => {
          const dx = playerPos.x - enemy.pos.x;
          const dy = playerPos.y - enemy.pos.y;
          const distance = Math.hypot(dx, dy) || 1;
          return {
            ...enemy,
            pos: {
              x: enemy.pos.x + (dx / distance) * enemy.speed * delta,
              y: enemy.pos.y + (dy / distance) * enemy.speed * delta,
            },
          };
        });

        bulletsRef.current = bulletsRef.current.map((bullet) => ({
          ...bullet,
          pos: {
            x: bullet.pos.x + bullet.vel.x * delta,
            y: bullet.pos.y + bullet.vel.y * delta,
          },
        }));

        let scoreGain = 0;
        let coinGain = 0;

        for (const bullet of bulletsRef.current) {
          if (bullet.damage <= 0) continue;

          for (const enemy of enemiesRef.current) {
            const dx = bullet.pos.x - enemy.pos.x;
            const dy = bullet.pos.y - enemy.pos.y;
            const hit = Math.hypot(dx, dy) < bullet.radius + enemy.radius;

            if (hit) {
              enemy.hp -= bullet.damage;
              bullet.damage = 0;

              if (enemy.hp <= 0) {
                scoreGain += enemy.scoreValue;

                if (Math.random() < 0.3) {
                  coinGain += randomBetween(enemy.coinMin, enemy.coinMax);
                }
              }

              break;
            }
          }
        }

        enemiesRef.current = enemiesRef.current.filter((enemy) => enemy.hp > 0);
        bulletsRef.current = bulletsRef.current.filter(
          (bullet) =>
            bullet.damage > 0 &&
            bullet.pos.x > -20 &&
            bullet.pos.x < WIDTH + 20 &&
            bullet.pos.y > -20 &&
            bullet.pos.y < HEIGHT + 20
        );

        let hp = previous.hp;
        for (const enemy of enemiesRef.current) {
          const dx = enemy.pos.x - playerPos.x;
          const dy = enemy.pos.y - playerPos.y;
          const touch = Math.hypot(dx, dy) < enemy.radius + PLAYER_RADIUS;
          if (touch) {
            hp -= enemy.touchDamage * delta;
          }
        }

        const time = previous.time + delta;
        const score = previous.score + scoreGain;
        const wave = Math.max(1, 1 + Math.floor(time / 16));

        let upgradeTokens = previous.upgradeTokens;

        const previousUpgradeWindow = Math.floor(previous.time / UPGRADE_INTERVAL_SECONDS);
        const currentUpgradeWindow = Math.floor(time / UPGRADE_INTERVAL_SECONDS);
        const newTimeUpgrades = Math.max(0, currentUpgradeWindow - previousUpgradeWindow);
        if (newTimeUpgrades > 0) {
          upgradeTokens += newTimeUpgrades;
        }

        if (upgradeTokens > previous.upgradeTokens) {
          setMenuOpen(true);
        }

        playerRenderRef.current = playerPos;

        if (hp <= 0) {
          stopMusic();
          setMenuOpen(true);
          return {
            ...previous,
            player: playerPos,
            hp: 0,
            score,
            wave,
            time,
            coins: previous.coins + coinGain,
            upgradeTokens,
            running: false,
            paused: true,
          };
        }

        return {
          ...previous,
          player: playerPos,
          hp,
          score,
          wave,
          time,
          coins: previous.coins + coinGain,
          upgradeTokens,
        };
      });

      context.clearRect(0, 0, WIDTH, HEIGHT);
      context.fillStyle = "#0a0f15";
      context.fillRect(0, 0, WIDTH, HEIGHT);

      context.strokeStyle = "rgba(255,255,255,0.06)";
      for (let x = 0; x <= WIDTH; x += 40) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, HEIGHT);
        context.stroke();
      }
      for (let y = 0; y <= HEIGHT; y += 40) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(WIDTH, y);
        context.stroke();
      }

      const renderPlayer = playerRenderRef.current;
      context.fillStyle = "#d6c4a0";
      context.beginPath();
      context.arc(renderPlayer.x, renderPlayer.y, PLAYER_RADIUS, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = "#4eb1a8";
      for (const bullet of bulletsRef.current) {
        context.beginPath();
        context.arc(bullet.pos.x, bullet.pos.y, bullet.radius, 0, Math.PI * 2);
        context.fill();
      }

      for (const enemy of enemiesRef.current) {
        const t = now / 1000;
        const bob = Math.sin(t * 7 + enemy.animSeed) * (enemy.radius * 0.12);
        const swing = Math.sin(t * 9 + enemy.animSeed) * 0.65;
        const bodyBase = enemy.radius;
        const headR = bodyBase * 0.42 * enemy.headScale;
        const torsoH = bodyBase * 1.25 * enemy.torsoScale;
        const torsoW = bodyBase * 0.8;
        const armL = bodyBase * 0.82 * enemy.armScale;
        const legL = bodyBase * 0.95 * enemy.legScale;

        context.save();
        context.translate(enemy.pos.x, enemy.pos.y + bob);

        context.fillStyle = enemy.skinColor;
        context.beginPath();
        context.arc(0, -torsoH * 0.95, headR, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = enemy.outfitColor;
        context.fillRect(-torsoW / 2, -torsoH * 0.75, torsoW, torsoH);

        context.strokeStyle = enemy.accentColor;
        context.lineWidth = Math.max(1.8, enemy.radius * 0.13);
        context.lineCap = "round";

        context.beginPath();
        context.moveTo(-torsoW * 0.45, -torsoH * 0.5);
        context.lineTo(-torsoW * 0.45 - swing * armL * 0.45, -torsoH * 0.12 + Math.abs(swing) * 2);
        context.moveTo(torsoW * 0.45, -torsoH * 0.5);
        context.lineTo(torsoW * 0.45 + swing * armL * 0.45, -torsoH * 0.12 + Math.abs(swing) * 2);
        context.stroke();

        context.strokeStyle = enemy.outfitColor;
        context.beginPath();
        context.moveTo(-torsoW * 0.25, torsoH * 0.25);
        context.lineTo(-torsoW * 0.2 - swing * 0.55, torsoH * 0.25 + legL);
        context.moveTo(torsoW * 0.25, torsoH * 0.25);
        context.lineTo(torsoW * 0.2 + swing * 0.55, torsoH * 0.25 + legL);
        context.stroke();

        context.fillStyle = enemy.accentColor;
        context.fillRect(-torsoW * 0.2, -torsoH * 0.25, torsoW * 0.4, torsoH * 0.18);

        context.restore();
      }

      loopRef.current = requestAnimationFrame(tick);
    };

    loopRef.current = requestAnimationFrame(tick);

    return () => {
      stopLoop();
    };
  }, [arena.running, stopMusic]);

  function buyDamageUpgrade() {
    setArena((previous) => {
      if (previous.upgradeTokens <= 0) return previous;
      return {
        ...previous,
        damage: previous.damage + 3,
        upgradeTokens: previous.upgradeTokens - 1,
      };
    });
    setClaimStatus("Damage upgraded.");
  }

  function buyLifeUpgrade() {
    setArena((previous) => {
      if (previous.upgradeTokens <= 0) return previous;
      const nextMaxHp = previous.maxHp + 20;
      const nextHp = Math.min(nextMaxHp, previous.hp + 20);
      return {
        ...previous,
        hp: nextHp,
        maxHp: nextMaxHp,
        upgradeTokens: previous.upgradeTokens - 1,
      };
    });
    setClaimStatus("Life upgraded.");
  }

  function resumeGame() {
    setMenuOpen(false);
    setArena((previous) => ({
      ...previous,
      paused: false,
      running: previous.hp > 0,
    }));
  }

  function toggleMusic() {
    setMusicOn((previous) => {
      const next = !previous;
      if (!next) {
        stopMusic();
      } else if (arena.running && !arena.paused) {
        startMusic();
      }
      return next;
    });
  }

  const secondsToNextUpgrade = Math.max(
    0,
    Math.ceil(UPGRADE_INTERVAL_SECONDS - (arena.time % UPGRADE_INTERVAL_SECONDS))
  );

  async function connectWallet() {
    try {
      if (!("ethereum" in window)) {
        setClaimStatus("No wallet provider detected.");
        return;
      }

      const provider = new BrowserProvider(
        (window as Window & { ethereum?: EthereumProvider }).ethereum as EthereumProvider
      );
      const accounts = await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();
      const account = accounts[0] as string | undefined;

      if (!account) {
        setClaimStatus("No wallet account selected.");
        return;
      }

      setWallet(account);
      setChainId(network.chainId.toString());
      setClaimStatus("Wallet connected. Reach score objective to unlock claim payload.");
    } catch {
      setClaimStatus("Unable to connect wallet.");
    }
  }

  async function claimPayload() {
    if (!wallet) {
      setClaimStatus("Connect wallet first.");
      return;
    }
    if (arena.score < CLAIM_SCORE_TARGET) {
      setClaimStatus("Reach score target first.");
      return;
    }

    const tokenUri = "ipfs://ds1-arena-survivor";

    const response = await fetch("/api/web3/achievement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress: wallet, tokenUri }),
    });

    const body = (await response.json()) as { message?: string; data?: string };

    if (!response.ok) {
      setClaimStatus(body.message || "Unable to create claim payload.");
      return;
    }

    setClaimStatus("Web3 payload generated. Sign and send it from your wallet flow.");
  }

  return (
    <motion.section
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 18 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="overflow-hidden rounded-3xl border border-[var(--color-web3)]/30 bg-[linear-gradient(140deg,rgba(78,177,168,0.08),rgba(214,196,160,0.08))] p-5 md:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.15em] text-[var(--color-text-muted)]">WEB3 ARENA PROTOTYPE</p>
          <h2 className="mt-2 font-display text-4xl text-[var(--color-text)]">BROTATO-STYLE SURVIVOR LAB</h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">
            Move with WASD or arrows. Auto-fire is enabled. 30% of defeated enemies drop coins. Enemies now give
            lower score, and the power-up menu appears every 120 seconds.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-[var(--color-text-soft)]">
          <span className="rounded-full border border-white/20 px-3 py-1">
            HP {Math.ceil(arena.hp)}/{arena.maxHp}
          </span>
          <span className="rounded-full border border-white/20 px-3 py-1">SCORE {arena.score}</span>
          <span className="rounded-full border border-white/20 px-3 py-1">GOLD {arena.coins}</span>
          <span className="rounded-full border border-white/20 px-3 py-1">DMG {arena.damage}</span>
          <span className="rounded-full border border-white/20 px-3 py-1">WAVE {arena.wave}</span>
          <span className="rounded-full border border-white/20 px-3 py-1">CHAIN {chainId}</span>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-white/15">
        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="h-auto w-full bg-[#0a0f15]" />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={resetGame}
          className="rounded-full bg-[var(--color-accent)] px-5 py-2 text-sm font-semibold text-[var(--color-bg)]"
        >
          {arena.running ? "RESTART RUN" : "START RUN"}
        </button>
        <button
          type="button"
          onClick={connectWallet}
          className="rounded-full border border-[var(--color-web3)]/70 px-5 py-2 text-sm text-[var(--color-text)]"
        >
          CONNECT WALLET
        </button>
        <button
          type="button"
          onClick={claimPayload}
          disabled={!canClaim}
          className="rounded-full border border-white/20 px-5 py-2 text-sm text-[var(--color-text)] disabled:opacity-40"
        >
          CLAIM WEB3 PAYLOAD
        </button>
        <button
          type="button"
          onClick={toggleMusic}
          className="rounded-full border border-white/20 px-5 py-2 text-sm text-[var(--color-text)]"
        >
          MUSIC {musicOn ? "ON" : "OFF"}
        </button>
      </div>

      <p className="mt-3 text-sm text-[var(--color-text-muted)]">{claimStatus}</p>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
        Score target: {CLAIM_SCORE_TARGET}. Next timed power-up in {secondsToNextUpgrade}s. Press Escape during game
        to open pause menu.
      </p>

      {menuOpen ? (
        <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-black/55 px-4">
          <div className="pointer-events-auto w-full max-w-lg rounded-2xl border border-white/20 bg-[var(--color-bg-soft)]/95 p-6">
            <h3 className="font-display text-3xl text-[var(--color-text)]">Arena Menu</h3>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              {arena.hp <= 0 ? "Run ended. Restart when ready." : "Paused. Choose your next action."}
            </p>

            <div className="mt-4 grid gap-2 text-sm text-[var(--color-text-soft)] sm:grid-cols-2">
              <p>Upgrade Tokens: {arena.upgradeTokens}</p>
              <p>Next Timed Upgrade: {secondsToNextUpgrade}s</p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={buyLifeUpgrade}
                disabled={arena.upgradeTokens <= 0}
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-[var(--color-text)] disabled:opacity-40"
              >
                BUY LIFE (+20)
              </button>
              <button
                type="button"
                onClick={buyDamageUpgrade}
                disabled={arena.upgradeTokens <= 0}
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-[var(--color-text)] disabled:opacity-40"
              >
                BUY DAMAGE (+3)
              </button>
              <button
                type="button"
                onClick={toggleMusic}
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-[var(--color-text)]"
              >
                MUSIC {musicOn ? "OFF" : "ON"}
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={resumeGame}
                disabled={arena.hp <= 0}
                className="rounded-full bg-[var(--color-accent)] px-5 py-2 text-sm font-semibold text-[var(--color-bg)] disabled:opacity-40"
              >
                RESUME
              </button>
              <button
                type="button"
                onClick={resetGame}
                className="rounded-full border border-white/20 px-5 py-2 text-sm text-[var(--color-text)]"
              >
                RESTART
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </motion.section>
  );
}
