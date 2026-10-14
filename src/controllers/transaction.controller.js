import { ethers } from "ethers";
import { getClient } from "../lib/stabletrustClient.js";

/**
 * POST /deposit
 *
 * Body:
 *   privateKey          {string}         Sender wallet private key
 *   tokenAddress        {string}         ERC-20 token contract address
 *   amount              {string|number}  Amount in token base units
 *   chainId             {number}         Chain ID
 *   waitForFinalization {boolean}        (optional, default true)
 */
export const deposit = async (req, res) => {
  const { privateKey, tokenAddress, amount, waitForFinalization, chainId } = req.body;

  if (!chainId) return res.status(400).json({ error: "chainId is required" });
  if (!privateKey)
    return res.status(400).json({ error: "privateKey is required" });
  if (!tokenAddress)
    return res.status(400).json({ error: "tokenAddress is required" });
  if (amount === undefined || amount === null)
    return res.status(400).json({ error: "amount is required" });

  try {
    const client = getClient(chainId);
    const wallet = new ethers.Wallet(privateKey, client.provider);
    await client.ensureAccount(wallet);
    const receipt = await client.confidentialDeposit(
      wallet,
      tokenAddress,
      BigInt(amount),
      { waitForFinalization: waitForFinalization !== false },
    );
    return res.json({
      success: true,
      message: "Deposit successful",
      tx: receipt.hash || receipt.transactionHash,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /transfer
 *
 * Body:
 *   privateKey          {string}         Sender wallet private key
 *   recipientAddress    {string}         Recipient Ethereum address
 *   tokenAddress        {string}         ERC-20 token contract address
 *   amount              {string|number}  Amount in token base units
 *   chainId             {number}         Chain ID
 *   useOffchainVerify   {boolean}        (optional, default false)
 *   waitForFinalization {boolean}        (optional, default true)
 */
export const transfer = async (req, res) => {
  const {
    privateKey,
    recipientAddress,
    tokenAddress,
    amount,
    chainId,
    useOffchainVerify,
    waitForFinalization,
  } = req.body;

  if (!chainId) return res.status(400).json({ error: "chainId is required" });
  if (!privateKey)
    return res.status(400).json({ error: "privateKey is required" });
  if (!recipientAddress)
    return res.status(400).json({ error: "recipientAddress is required" });
  if (!tokenAddress)
    return res.status(400).json({ error: "tokenAddress is required" });
  if (amount === undefined || amount === null)
    return res.status(400).json({ error: "amount is required" });

  try {
    const client = getClient(chainId);
    const wallet = new ethers.Wallet(privateKey, client.provider);
    await client.ensureAccount(wallet);
    const receipt = await client.confidentialTransfer(
      wallet,
      recipientAddress,
      tokenAddress,
      BigInt(amount),
      {
        useOffchainVerify: useOffchainVerify === true,
        waitForFinalization: waitForFinalization !== false,
      },
    );
    return res.json({
      success: true,
      message: "Transfer successful",
      tx: receipt.hash || receipt.transactionHash,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /withdraw
 *
 * Body:
 *   privateKey          {string}         Wallet private key
 *   tokenAddress        {string}         ERC-20 token contract address
 *   amount              {string|number}  Amount in token base units
 *   chainId             {number}         Chain ID
 *   useOffchainVerify   {boolean}        (optional, default false)
 *   waitForFinalization {boolean}        (optional, default true)
 */
export const withdraw = async (req, res) => {
  const {
    privateKey,
    tokenAddress,
    amount,
    chainId,
    useOffchainVerify,
    waitForFinalization,
  } = req.body;

  if (!chainId) return res.status(400).json({ error: "chainId is required" });
  if (!privateKey)
    return res.status(400).json({ error: "privateKey is required" });
  if (!tokenAddress)
    return res.status(400).json({ error: "tokenAddress is required" });
  if (amount === undefined || amount === null)
    return res.status(400).json({ error: "amount is required" });

  try {
    const client = getClient(chainId);
    const wallet = new ethers.Wallet(privateKey, client.provider);
    await client.ensureAccount(wallet);
    const receipt = await client.withdraw(
      wallet,
      tokenAddress,
      BigInt(amount),
      {
        useOffchainVerify: useOffchainVerify === true,
        waitForFinalization: waitForFinalization !== false,
      },
    );
    return res.json({
      success: true,
      message: "Withdrawal successful",
      tx: receipt.hash || receipt.transactionHash,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
