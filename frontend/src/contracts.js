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

// Contract addresses (updated after deployment)
export const CONTRACTS = {
  batchSplitter: "0xd43C01AA7C040315Cd0Fc9eB6B27130d34180205",
  raffle: "0xbEB798aEE5dA6b2059CafA53a804874F24F6D8f4",
};

// ABIs
export { default as BatchSplitterABI } from "./abis/BatchSplitter.json";
export { default as RaffleABI } from "./abis/Raffle.json";
