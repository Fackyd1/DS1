# DS1 - THE DEVELOPER'S REALM

Professional interactive platform by **Gaspar Doval (DS1)**.

Roles represented by the product:

- Full Stack Developer
- Game Developer
- Creative Technologist

This project combines portfolio, interactive CV, gameplay progression, backend APIs, relational data design, admin operations and optional Web3 achievement minting.

## Stack

### Frontend

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Framer Motion
- Lucide

### Backend/API

- Next.js Route Handlers (Node runtime)
- Zod validation
- Role-based auth guards
- Rate limiting utility

### Data

- Prisma ORM
- PostgreSQL schema

### Game Systems

- Server-validated economy loop
- Resources, buildings, workers
- Quests, achievements, progression
- Leaderboard endpoints

### Web3

- ethers + viem
- OpenZeppelin ERC-721 contract
- Hardhat tests and deploy script

## Key Routes

- `/` Home + hero
- `/projects` Portfolio explorer + filters
- `/projects/[slug]` Case study detail
- `/skills` Skill system
- `/experience` Professional journey
- `/contact` Contact terminal
- `/realm` Realm hub
- `/realm/game` Playable game loop UI
- `/realm/profile` Player profile + wallet panel
- `/realm/leaderboard` Leaderboard + event feed
- `/admin` RBAC protected admin area

## API Highlights

- `GET /api/projects`
- `GET /api/projects/[slug]`
- `POST /api/projects` (ADMIN/EDITOR)
- `PUT /api/projects/[id]` (ADMIN/EDITOR)
- `DELETE /api/projects/[id]` (ADMIN)
- `GET /api/skills`
- `GET /api/player`
- `POST /api/game/gather`
- `POST /api/game/build`
- `POST /api/game/hire`
- `POST /api/game/sell`
- `GET /api/leaderboard`
- `POST /api/web3/achievement`
- `POST /api/contact`

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Fill required values in `.env`.

4. Generate Prisma client:

```bash
npm run prisma:generate
```

5. Run DB migration and seed:

```bash
npm run prisma:migrate
npm run prisma:seed
```

6. Start dev server:

```bash
npm run dev
```

## Quality Checks

```bash
npm run lint
npm run test
npm run build
```

## Contract Commands

```bash
npm run contract:compile
npm run contract:test
npm run contract:deploy:testnet
```

## Environment Variables

See `.env.example`:

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXTAUTH_URL`
- `WEB3_RPC_URL`
- `NEXT_PUBLIC_CHAIN_ID`
- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`
- `CONTRACT_ADDRESS`
- `EMAIL_SERVER`
- `EMAIL_USER`
- `EMAIL_PASSWORD`
- `DEPLOYER_PRIVATE_KEY`

## Docs

- `docs/architecture.md`
- `docs/database.md`
- `docs/game-design.md`
- `docs/web3.md`
- `docs/deployment.md`
