// BOT Chain Network Config — Mainnet
export const BOT_CHAIN_CONFIG = {
  chainId: "0x2A5", // 677 in hex
  chainName: "BOT Chain",
  nativeCurrency: {
    name: "BOT",
    symbol: "BOT",
    decimals: 18,
  },
  rpcUrls: ["https://rpc.botchain.ai"],
  blockExplorerUrls: ["https://scan.botchain.ai"],
};

// Contract addresses — set via .env (VITE_ prefix) or Vercel env vars
export const CONTRACTS = {
  batchSplitter: import.meta.env.VITE_BATCHSPLITTER_ADDRESS,
  raffle: import.meta.env.VITE_RAFFLE_ADDRESS,
};

// ABIs
export { default as BatchSplitterABI } from "./abis/BatchSplitter.json";
export { default as RaffleABI } from "./abis/Raffle.json";
