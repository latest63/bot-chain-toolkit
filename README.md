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
- Create raffles with configurable ticket price, max tickets, and duration
- Multiple entries per user (weighted odds)
- Blockhash-based randomness — no oracle needed
- Cancel & refund support
- Leverages BOT Chain's ~0.75s block times for fast draws

## Deployed Contracts (BOT Chain Testnet)

| Contract | Address |
|---|---|
| BatchSplitter | [`0xd43C01AA7C040315Cd0Fc9eB6B27130d34180205`](https://scan.bohr.life/address/0xd43C01AA7C040315Cd0Fc9eB6B27130d34180205) |
| Raffle | [`0xbEB798aEE5dA6b2059CafA53a804874F24F6D8f4`](https://scan.bohr.life/address/0xbEB798aEE5dA6b2059CafA53a804874F24F6D8f4) |

## Tech Stack
- **Contracts:** Solidity 0.8.28, Foundry (see `contracts-foundry/`)
- **Frontend:** React, Vite, ethers.js v6
- **Network:** BOT Chain Testnet (Chain ID 968)

## Quick Start

### Frontend
```bash
npm install
npm run dev
```

### Contracts
```bash
# Install Foundry: https://book.getfoundry.sh
curl -L https://foundry.paradigm.xyz | bash && foundryup

cd contracts-foundry
forge build
forge test -vv
```

## Network Config
- **Chain ID:** 968
- **RPC:** https://rpc.bohr.life
- **Explorer:** https://scan.bohr.life
- **Faucet:** https://faucet.botchain.ai/basic

## Track
**Open Track** — Innovative tooling for the BOT Chain ecosystem

## License
MIT
