// BOT Chain Network Config
export const BOT_CHAIN_CONFIG = {
  chainId: "0x3C8", // 968 in hex
  chainName: "BOT Chain Testnet",
  nativeCurrency: {
    name: "BOT",
    symbol: "BOT",
    decimals: 18,
  },
  rpcUrls: ["https://rpc.bohr.life"],
  blockExplorerUrls: ["https://scan.bohr.life"],
};

// Contract addresses — set via .env (VITE_ prefix) or Vercel env vars
export const CONTRACTS = {
  batchSplitter: import.meta.env.VITE_BATCHSPLITTER_ADDRESS,
  raffle: import.meta.env.VITE_RAFFLE_ADDRESS,
};

// ABIs
export { default as BatchSplitterABI } from "./abis/BatchSplitter.json";
export { default as RaffleABI } from "./abis/Raffle.json";
