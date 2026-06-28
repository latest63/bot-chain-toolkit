# BOT Chain Toolkit

**Batch Splitter + On-Chain Raffle** — Built for the [BOT Chain Builder Challenge #1](https://rapid-change-2c1.notion.site/BOT-Chain-Builder-Challenge-1-38846f6c38d580c99a84d5022ba83ac5)

## What It Does

### 💸 Batch Splitter
Send native BOT tokens to multiple recipients in a single transaction.
- **Equal Split** — divide a total amount equally among N recipients
- **Custom Amounts** — specify exact amounts per recipient
- Saves gas vs individual transfers, perfect for payroll, airdrops, rewards

### 🎟️ On-Chain Raffle
Verifiably fair lottery using blockhash randomness.
- Create raffles with on-chain name, title, community, and banner color
- Configurable ticket price, max tickets, and duration
- Multiple entries per user (weighted odds)
- Blockhash-based randomness — no oracle needed
- Cancel & refund support
- Leverages BOT Chain's ~0.75s block times for fast draws

## Deployed Contracts (BOT Chain Testnet)

| Contract | Address |
|---|---|
| BatchSplitter | [`0xd43C01AA7C040315Cd0Fc9eB6B27130d34180205`](https://scan.bohr.life/address/0xd43C01AA7C040315Cd0Fc9eB6B27130d34180205) |
| Raffle | [`0x13c87c9a2212567c1bcf8df1a00154045d47cc31`](https://scan.bohr.life/address/0x13c87c9a2212567c1bcf8df1a00154045d47cc31) |

## Tech Stack
- **Contracts:** Solidity 0.8.28, Foundry (see `contracts-foundry/`)
- **Frontend:** React, Vite, ethers.js v6
- **Network:** BOT Chain Testnet (Chain ID 968)

## Quick Start

### Frontend
```bash
npm install

# Copy env and set your contract addresses
cp .env.example .env

npm run dev
```

### Environment Variables

The frontend reads contract addresses from env vars (Vite `VITE_` prefix):

| Variable | Description |
|---|---|
| `VITE_BATCHSPLITTER_ADDRESS` | BatchSplitter contract address |
| `VITE_RAFFLE_ADDRESS` | Raffle contract address |

For **Vercel**, add these in Project Settings → Environment Variables.
For **local dev**, set them in `.env`.

### Contracts

```bash
# Install Foundry: https://book.getfoundry.sh
curl -L https://foundry.paradigm.xyz | bash && foundryup

cd contracts-foundry
forge build
forge test -vv
```

## Deploying Contracts (Safe Method)

### Option A: Foundry Keystore (Recommended)

Import your deployer wallet into Foundry's encrypted keystore — private key never touches a file or env var.

```bash
# Import wallet (interactive, prompts for private key and password)
cast wallet import deployer --keystore-dir ~/.foundry/keystores

# Verify it's imported
cast wallet address --keystore ~/.foundry/keystores/deployer --password <your-password>

# Deploy
cd contracts-foundry
forge script script/Deploy.s.sol \
  --rpc-url https://rpc.bohr.life \
  --broadcast \
  --keystore ~/.foundry/keystores/deployer \
  --password <your-password>

# Update .env with the new contract addresses from the output
```

### Option B: Hardware Wallet (Ledger/Trezor)

```bash
forge script script/Deploy.s.sol \
  --rpc-url https://rpc.bohr.life \
  --broadcast \
  --ledger
```

### Option C: Environment Variable (CI only)

```bash
# Only use in CI pipelines — never commit .env
export PRIVATE_KEY=0x...
forge script script/Deploy.s.sol \
  --rpc-url https://rpc.bohr.life \
  --broadcast \
  --private-key $PRIVATE_KEY
```

### After Deployment

1. Copy the deployed contract address from the forge output
2. Update `src/contracts.js` defaults (or set `VITE_*` env vars)
3. Update `.env.example` with the new addresses
4. Update the contract address table in this README
5. Update the ABI: `cp contracts-foundry/out/Raffle.sol/Raffle.json src/abis/Raffle.json`
6. Commit and push — Vercel auto-deploys

## Network Config
- **Chain ID:** 968
- **RPC:** https://rpc.bohr.life
- **Explorer:** https://scan.bohr.life
- **Faucet:** https://faucet.botchain.ai/basic

## Security

- **Never commit** `.env`, private keys, or keystore files
- `.env` and `contracts-foundry/broadcast/` are in `.gitignore`
- Contract addresses are read from env vars with hardcoded fallbacks
- Use Foundry keystore or hardware wallets for deployment — avoid raw private keys

## Track
**Open Track** — Innovative tooling for the BOT Chain ecosystem

## License
MIT
