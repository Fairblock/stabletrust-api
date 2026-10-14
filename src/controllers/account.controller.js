import { ethers } from "ethers";
import { getClient } from "../lib/stabletrustClient.js";

/**
 * POST /balance
 *
 * Body:
 *   privateKey   {string}  Wallet private key (used for decryption)
 *   tokenAddress {string}  ERC-20 token contract address
 *   chainId      {number}  Chain ID
 *   address      {string}  (optional) Address to query; defaults to wallet derived from privateKey
 */
export const getBalance = async (req, res) => {
  const { privateKey, tokenAddress, chainId, address } = req.body;

  if (!chainId) return res.status(400).json({ error: "chainId is required" });
  if (!privateKey)
    return res.status(400).json({ error: "privateKey is required" });
  if (!tokenAddress)
    return res.status(400).json({ error: "tokenAddress is required" });

  try {
    const client = getClient(chainId);
    const wallet = new ethers.Wallet(privateKey, client.provider);
    const queryAddress = address || (await wallet.getAddress());

    // Read-only: derive the decryption key (off-chain signature, no tx) and read
    // on-chain state. This endpoint never provisions an account - if one does not
    // exist yet, call POST /account/create first.
    const { privateKey: elgamalKey } = await client._deriveKeys(wallet);
    const info = await client.getAccountInfo(queryAddress);
    if (!info.exists) {
      return res.json({
        success: true,
        address: queryAddress,
        tokenAddress,
        exists: false,
        balance: { total: "0", available: "0", pending: "0" },
      });
    }

    const balance = await client.getConfidentialBalance(
      queryAddress,
      elgamalKey,
      tokenAddress,
    );

    return res.json({
      success: true,
      address: queryAddress,
      tokenAddress,
      exists: true,
      balance: {
        total: balance.amount.toString(),
        available: balance.available.amount.toString(),
        pending: balance.pending.amount.toString(),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /account/create
 *
 * Provisions the caller's confidential account on-chain if it doesn't exist yet
 * (idempotent). Required before an account can receive a transfer.
 *
 * Body:
 *   privateKey          {string}   Wallet private key
 *   chainId             {number}   Chain ID
 *   waitForFinalization {boolean}  (optional, default true)
 */
export const createAccount = async (req, res) => {
  const { privateKey, chainId, waitForFinalization } = req.body;

  if (!chainId) return res.status(400).json({ error: "chainId is required" });
  if (!privateKey)
    return res.status(400).json({ error: "privateKey is required" });

  try {
    const client = getClient(chainId);
    const wallet = new ethers.Wallet(privateKey, client.provider);
    const address = await wallet.getAddress();

    const before = await client.getAccountInfo(address);
    await client.ensureAccount(wallet, {
      waitForFinalization: waitForFinalization !== false,
    });

    return res.json({
      success: true,
      address,
      created: !before.exists,
      message: before.exists
        ? "Account already exists"
        : "Account created successfully",
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /apply
 *
 * Applies the caller's pending balance (e.g. funds just received from a transfer),
 * moving it from `pending` to `available` so it can be spent or withdrawn.
 *
 * Body:
 *   privateKey          {string}   Wallet private key
 *   chainId             {number}   Chain ID
 *   waitForFinalization {boolean}  (optional, default true)
 */
export const applyPending = async (req, res) => {
  const { privateKey, chainId, waitForFinalization } = req.body;

  if (!chainId) return res.status(400).json({ error: "chainId is required" });
  if (!privateKey)
    return res.status(400).json({ error: "privateKey is required" });

  try {
    const client = getClient(chainId);
    const wallet = new ethers.Wallet(privateKey, client.provider);
    const address = await wallet.getAddress();

    const info = await client.getAccountInfo(address);
    if (!info.exists) {
      return res.status(400).json({
        success: false,
        error: "No confidential account for this wallet; create one first",
      });
    }

    const receipt = await client._applyPending(wallet, {
      waitForFinalization: waitForFinalization !== false,
    });

    return res.json({
      success: true,
      message: "Pending balance applied",
      tx: receipt.hash || receipt.transactionHash,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
