# Database

## Provider

Prisma schema targets PostgreSQL.

## Core Models

- User, Role, Wallet
- Project, Skill, Experience, ContactMessage
- Player, PlayerResource, Building, Worker
- Quest, PlayerQuest
- Achievement, PlayerAchievement
- GameEvent, LeaderboardEntry

## Commands

- Generate client: `npm run prisma:generate`
- Create migration: `npm run prisma:migrate`
- Seed data: `npm run prisma:seed`

## Notes

- Set `DATABASE_URL` before running migrations/seeds.
- Seeder imports portfolio and game config defaults.
