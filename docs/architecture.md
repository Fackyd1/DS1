# Architecture

## Overview

DS1 - The Developer's Realm is a modular Next.js platform that combines:

- Professional portfolio and interactive CV.
- Single-player realm progression game.
- Optional wallet integration and achievement NFT mint flow.
- Admin and API surface for content + game operations.

## Layers

- UI layer: Next.js App Router pages and domain components.
- Domain services: portfolio, game engine, realtime event feed.
- API layer: REST endpoints with Zod validation and rate limiting.
- Data layer: Prisma models for relational persistence.
- Web3 layer: Solidity ERC-721 contract + frontend mint payload flow.

## Security

- Input validation through Zod.
- Role checks on admin mutating endpoints.
- HttpOnly signed session cookie.
- Security headers configured in Next.js.
- No private keys or seed phrases in source.

## Scalability

- Stateless route handlers around explicit services.
- Replaceable persistence adapters.
- Domain-specific folders for long-term maintainability.
