# Deployment

## Runtime Requirements

- Node.js 20+
- PostgreSQL instance
- Environment variables from `.env.example`

## Build Steps

1. Install deps: `npm install`
2. Prisma generate: `npm run prisma:generate`
3. Migrate DB: `npm run prisma:migrate`
4. Seed DB: `npm run prisma:seed`
5. Lint + tests: `npm run lint && npm run test`
6. Build: `npm run build`
7. Start: `npm run start`

## Contracts

- Compile: `npm run contract:compile`
- Test: `npm run contract:test`
- Deploy testnet: `npm run contract:deploy:testnet`

## Security Checklist

- Configure strong `AUTH_SECRET`.
- Keep deployer keys only in environment.
- Restrict CORS and trusted origins in production infrastructure.
