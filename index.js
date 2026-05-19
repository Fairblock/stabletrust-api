import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { ethers } from "ethers";
import { ConfidentialTransferClient } from "@fairblock/stabletrust";

const app = express();
app.use(cors());
app.use(express.json());
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { success: false, error: "Too many requests, please try again later." },
  })
);

const PORT = process.env.PORT || 3000;

const RPC_URLS = {
  2201: "https://rpc.testnet.stable.xyz",
  5042002: "https://rpc.testnet.arc.network",
  84532: "https://base-testnet.api.pocket.network",
  11155111: "https://ethereum-sepolia-rpc.publicnode.com",
  421614: "https://arbitrum-sepolia-testnet.api.pocket.network",
};

const clients = {};

function getClient(chainId) {
  const rpcUrl = process.env[`RPC_URL_${chainId}`] || RPC_URLS[chainId];
  if (!rpcUrl) {
    throw new Error(`Unsupported chainId: ${chainId}`);
  }
  if (!clients[chainId]) {
    clients[chainId] = new ConfidentialTransferClient(rpcUrl, Number(chainId));
  }
  return clients[chainId];
}


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
app.post("/deposit", async (req, res) => {
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
});

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
app.post("/transfer", async (req, res) => {
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
      Number(amount),
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
});

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
app.post("/withdraw", async (req, res) => {
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
      Number(amount),
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
});

/**
 * POST /balance
 *
 * Body:
 *   privateKey   {string}  Wallet private key (used for decryption)
 *   tokenAddress {string}  ERC-20 token contract address
 *   chainId      {number}  Chain ID
 *   address      {string}  (optional) Address to query; defaults to wallet derived from privateKey
 */
app.post("/balance", async (req, res) => {
  const { privateKey, tokenAddress, chainId, address } = req.body;

  if (!chainId) return res.status(400).json({ error: "chainId is required" });
  if (!privateKey)
    return res.status(400).json({ error: "privateKey is required" });
  if (!tokenAddress)
    return res.status(400).json({ error: "tokenAddress is required" });

  try {
    const client = getClient(chainId);
    const wallet = new ethers.Wallet(privateKey, client.provider);
    await client.ensureAccount(wallet);
    const queryAddress = address || (await wallet.getAddress());
    const { privateKey: elgamalKey } = await client._deriveKeys(wallet);
    const balance = await client.getConfidentialBalance(
      queryAddress,
      elgamalKey,
      tokenAddress,
    );

    return res.json({
      success: true,
      address: queryAddress,
      tokenAddress,
      balance: {
        total: balance.amount.toString(),
        available: balance.available.amount.toString(),
        pending: balance.pending.amount.toString(),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/health", async (req, res) => {
  return res.status(200).json({
    message: "Server is working",
  });
});
app.listen(PORT, () => {
  console.log(`StableTrust server listening on http://localhost:${PORT}`);
  console.log(
    `  POST /deposit   — deposit ERC-20 tokens into confidential account`,
  );
  console.log(
    `  POST /transfer  — confidential token transfer between accounts`,
  );
  console.log(
    `  POST /withdraw  — withdraw confidential tokens to public ERC-20`,
  );
  console.log(
    `  POST /balance   — get decrypted confidential balance for a wallet`,
  );
});
