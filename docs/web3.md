# Web3

## Wallet Mode

Wallet connection is optional and handled client-side via ethers provider.
No private keys or seed phrases are ever requested or stored.

## Achievement Mint

Endpoint: `POST /api/web3/achievement`

- Requires authenticated player session.
- Requires REALM_COMPLETED achievement.
- Returns encoded transaction data for `mintAchievement`.

## Contract

`contracts/RealmAchievement.sol`

- ERC-721 URI storage.
- Owner-only mint.
- Prevents duplicate mint per player+achievement.

## Testnet

Default chain id uses Sepolia in `.env.example`.
