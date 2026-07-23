"use client";

import { BrowserProvider } from "ethers";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

type Vec2 = { x: number; y: number };

type Enemy = {
  id: number;
  pos: Vec2;
  hp: number;
  speed: number;
  radius: number;
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
  score: number;
  wave: number;
  time: number;
  running: boolean;
};

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

const WIDTH = 900;
const HEIGHT = 460;
const PLAYER_RADIUS = 14;
const PLAYER_SPEED = 220;
const SPAWN_EVERY_MS = 900;
const SHOOT_EVERY_MS = 220;
const TARGET_SCORE = 220;

export function Web3Arena() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loopRef = useRef<number | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const playerRenderRef = useRef<Vec2>({ x: WIDTH / 2, y: HEIGHT / 2 });
  const waveRef = useRef(1);
  const nextEnemyIdRef = useRef(1);
  const nextBulletIdRef = useRef(1);
  const lastSpawnRef = useRef(0);
  const lastShootRef = useRef(0);
  const lastTickRef = useRef(0);

  const [arena, setArena] = useState<ArenaState>({
    player: { x: WIDTH / 2, y: HEIGHT / 2 },
    hp: 100,
    score: 0,
    wave: 1,
    time: 0,
    running: false,
  });
  const [wallet, setWallet] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string>("-");
  const [claimStatus, setClaimStatus] = useState("Connect wallet and survive to claim Web3 payload.");
  const shouldReduceMotion = useReducedMotion();

  const canClaim = useMemo(() => arena.score >= TARGET_SCORE && Boolean(wallet), [arena.score, wallet]);

  function resetGame() {
    enemiesRef.current = [];
    bulletsRef.current = [];
    nextEnemyIdRef.current = 1;
    nextBulletIdRef.current = 1;
    lastSpawnRef.current = 0;
    lastShootRef.current = 0;
    lastTickRef.current = 0;
    setArena({
      player: { x: WIDTH / 2, y: HEIGHT / 2 },
      hp: 100,
      score: 0,
      wave: 1,
      time: 0,
      running: true,
    });
    playerRenderRef.current = { x: WIDTH / 2, y: HEIGHT / 2 };
    waveRef.current = 1;
    setClaimStatus("Survive and reach score to unlock mint payload.");
  }

  function stopLoop() {
    if (loopRef.current !== null) {
      cancelAnimationFrame(loopRef.current);
      loopRef.current = null;
    }
  }

  useEffect(() => {
    const onDown = (event: KeyboardEvent) => {
      keysRef.current[event.key.toLowerCase()] = true;
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
    };
  }, []);

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

    const spawnEnemy = (now: number) => {
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

      enemiesRef.current.push({
        id: nextEnemyIdRef.current++,
        pos: { x, y },
        hp: 14 + Math.floor(waveRef.current * 2),
        speed: 38 + waveRef.current * 2,
        radius: 10,
      });
    };

    const shoot = (now: number, playerPos: Vec2) => {
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
        damage: 8,
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

        let px = previous.player.x;
        let py = previous.player.y;

        const keys = keysRef.current;
        const vx = (keys["d"] || keys["arrowright"] ? 1 : 0) - (keys["a"] || keys["arrowleft"] ? 1 : 0);
        const vy = (keys["s"] || keys["arrowdown"] ? 1 : 0) - (keys["w"] || keys["arrowup"] ? 1 : 0);
        const mag = Math.hypot(vx, vy) || 1;

        px += ((vx / mag) * PLAYER_SPEED + (mag === 1 && vx === 0 ? 0 : 0)) * delta;
        py += ((vy / mag) * PLAYER_SPEED + (mag === 1 && vy === 0 ? 0 : 0)) * delta;

        px = clamp(px, PLAYER_RADIUS, WIDTH - PLAYER_RADIUS);
        py = clamp(py, PLAYER_RADIUS, HEIGHT - PLAYER_RADIUS);

        const playerPos = { x: px, y: py };

        spawnEnemy(now);
        shoot(now, playerPos);

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
        for (const bullet of bulletsRef.current) {
          for (const enemy of enemiesRef.current) {
            const dx = bullet.pos.x - enemy.pos.x;
            const dy = bullet.pos.y - enemy.pos.y;
            const hit = Math.hypot(dx, dy) < bullet.radius + enemy.radius;
            if (hit) {
              enemy.hp -= bullet.damage;
              bullet.damage = 0;
              if (enemy.hp <= 0) {
                scoreGain += 10;
              }
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
            hp -= 8 * delta;
          }
        }

        const time = previous.time + delta;
        const score = previous.score + scoreGain;
        const wave = Math.max(1, 1 + Math.floor(time / 16));

        if (hp <= 0) {
          playerRenderRef.current = playerPos;
          waveRef.current = wave;
          return {
            ...previous,
            player: playerPos,
            hp: 0,
            score,
            wave,
            time,
            running: false,
          };
        }

        playerRenderRef.current = playerPos;
        waveRef.current = wave;

        return {
          ...previous,
          player: playerPos,
          hp,
          score,
          wave,
          time,
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

      context.fillStyle = "#d6c4a0";
      const renderPlayer = playerRenderRef.current;
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
        context.fillStyle = "#ff7b7b";
        context.beginPath();
        context.arc(enemy.pos.x, enemy.pos.y, enemy.radius, 0, Math.PI * 2);
        context.fill();
      }

      loopRef.current = requestAnimationFrame(tick);
    };

    loopRef.current = requestAnimationFrame(tick);

    return () => {
      stopLoop();
    };
  }, [arena.running]);

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
      setClaimStatus("Wallet connected. Hit score target to unlock claim payload.");
    } catch {
      setClaimStatus("Unable to connect wallet.");
    }
  }

  async function claimPayload() {
    if (!wallet) {
      setClaimStatus("Connect wallet first.");
      return;
    }
    if (arena.score < TARGET_SCORE) {
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

    setClaimStatus("Web3 payload generated. You can sign transaction in your wallet flow.");
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
            Move with WASD or arrows. Auto-fire is enabled. Survive waves, farm score, connect wallet and unlock
            claim payload when you hit the target score.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-[var(--color-text-soft)]">
          <span className="rounded-full border border-white/20 px-3 py-1">HP {Math.ceil(arena.hp)}</span>
          <span className="rounded-full border border-white/20 px-3 py-1">SCORE {arena.score}</span>
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
      </div>

      <p className="mt-3 text-sm text-[var(--color-text-muted)]">{claimStatus}</p>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
        Score target: {TARGET_SCORE}. Contract mint requires active session and achievement validation on backend.
      </p>
    </motion.section>
  );
}
