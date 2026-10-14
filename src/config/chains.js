// Default public RPC endpoint per supported chain ID.
// Any of them can be overridden with RPC_URL_<chainId> in the environment.
export const RPC_URLS = {
  2201: "https://rpc.testnet.stable.xyz",
  5042002: "https://rpc.testnet.arc.network",
  84532: "https://base-testnet.api.pocket.network",
  11155111: "https://ethereum-sepolia-rpc.publicnode.com",
  421614: "https://arbitrum-sepolia-testnet.api.pocket.network",
  42161: "https://arb1.arbitrum.io/rpc",
  8453: "https://mainnet.base.org",
  1: "https://ethereum-rpc.publicnode.com",
};
