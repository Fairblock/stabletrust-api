import { ConfidentialTransferClient } from "@fairblock/stabletrust";
import { RPC_URLS } from "../config/index.js";

// One SDK client per chain, created on first use and reused afterwards.
const clients = {};

export function getClient(chainId) {
  const rpcUrl = process.env[`RPC_URL_${chainId}`] || RPC_URLS[chainId];
  if (!rpcUrl) {
    throw new Error(`Unsupported chainId: ${chainId}`);
  }
  if (!clients[chainId]) {
    // Public testnets resolve their diamond from the SDK's built-in chain map as before..
    // Chains without a default (eg; a local devnet on 31337) can supply the
    // diamond explicitly via CONTRACT_ADDRESS_<chainId>
    const contractAddress = process.env[`CONTRACT_ADDRESS_${chainId}`];
    clients[chainId] = contractAddress
      ? new ConfidentialTransferClient(rpcUrl, contractAddress, Number(chainId))
      : new ConfidentialTransferClient(rpcUrl, Number(chainId));
  }
  return clients[chainId];
}
