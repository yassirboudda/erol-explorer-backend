# EROL Explorer Backend

TypeScript/Node.js backend for the EROL block explorer. Part of the AMI L1aaS platform.

## Architecture

- **API server** (`src/index.ts`) — REST API for blocks, transactions, contracts
- **Indexer** (`periphery/indexer/index.ts`) — chain indexer that populates MongoDB

## Quick Start

```bash
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and chain RPC URL

# Start API
npm run start:api

# Start indexer (separate terminal)
npm run start:indexer
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | API server port (default: 3002) |
| `DB_STRING` | MongoDB connection string |
| `DB_NAME` | MongoDB database name |
| `RPC_URL` | Chain JSON-RPC endpoint URL |

## API Endpoints

- `GET /blocks` — list recent blocks
- `GET /blocks/:id` — block detail
- `GET /transactions` — list recent transactions
- `GET /transactions/:hash` — transaction detail
- `GET /entities/:address` — contract/address info

## Deployment

### Infra server (production)
```bash
# Install dependencies
npm install

# Run via systemd or pm2
pm2 start "npm run start:api" --name explorer-api
pm2 start "npm run start:indexer" --name explorer-indexer
```

### Per-client template

This repo serves as the template in `vultr_startup_infra.sh` Script 3.
Each client gets:
- Their own MongoDB database (`DB_NAME=<client>_explorer`)
- Their own RPC URL (`RPC_URL=<client-rpc>`)
- Nginx reverse-proxy on `/api/<chainid>/`
