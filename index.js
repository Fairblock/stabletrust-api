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
const RPC_URL = process.env.RPC_URL;
const CHAIN_ID = process.env.CHAIN_ID
  ? Number(process.env.CHAIN_ID)
  : undefined;

if (!RPC_URL) throw new Error("RPC_URL must be set in .env");
if (!CHAIN_ID) throw new Error("CHAIN_ID must be set in .env");

const sharedClient = new ConfidentialTransferClient(RPC_URL, CHAIN_ID);

// Serialize receipt — converts BigInt values to strings for JSON response
function serializeReceipt(receipt) {
  return JSON.parse(
    JSON.stringify(receipt, (_, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
  );
}

/**
 * POST /deposit
 *
 * Body:
 *   privateKey          {string}         Sender wallet private key
 *   tokenAddress        {string}         ERC-20 token contract address
 *   amount              {string|number}  Amount in token base units
 *   waitForFinalization {boolean}        (optional, default true)
 */
app.post("/deposit", async (req, res) => {
  const { privateKey, tokenAddress, amount, waitForFinalization } = req.body;

  if (!privateKey)
    return res.status(400).json({ error: "privateKey is required" });
  if (!tokenAddress)
    return res.status(400).json({ error: "tokenAddress is required" });
  if (amount === undefined || amount === null)
    return res.status(400).json({ error: "amount is required" });

  try {
    const wallet = new ethers.Wallet(privateKey, sharedClient.provider);
    await sharedClient.ensureAccount(wallet);
    const receipt = await sharedClient.confidentialDeposit(
      wallet,
      tokenAddress,
      BigInt(amount),
      { waitForFinalization: waitForFinalization !== false },
    );
    return res.json({ success: true, receipt: serializeReceipt(receipt) });
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
 *   useOffchainVerify   {boolean}        (optional, default false)
 *   waitForFinalization {boolean}        (optional, default true)
 */
app.post("/transfer", async (req, res) => {
  const {
    privateKey,
    recipientAddress,
    tokenAddress,
    amount,
    useOffchainVerify,
    waitForFinalization,
  } = req.body;

  if (!privateKey)
    return res.status(400).json({ error: "privateKey is required" });
  if (!recipientAddress)
    return res.status(400).json({ error: "recipientAddress is required" });
  if (!tokenAddress)
    return res.status(400).json({ error: "tokenAddress is required" });
  if (amount === undefined || amount === null)
    return res.status(400).json({ error: "amount is required" });

  try {
    const wallet = new ethers.Wallet(privateKey, sharedClient.provider);
    const receipt = await sharedClient.confidentialTransfer(
      wallet,
      recipientAddress,
      tokenAddress,
      Number(amount),
      {
        useOffchainVerify: useOffchainVerify === true,
        waitForFinalization: waitForFinalization !== false,
      },
    );
    return res.json({ success: true, receipt: serializeReceipt(receipt) });
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
 *   useOffchainVerify   {boolean}        (optional, default false)
 *   waitForFinalization {boolean}        (optional, default true)
 */
app.post("/withdraw", async (req, res) => {
  const {
    privateKey,
    tokenAddress,
    amount,
    useOffchainVerify,
    waitForFinalization,
  } = req.body;

  if (!privateKey)
    return res.status(400).json({ error: "privateKey is required" });
  if (!tokenAddress)
    return res.status(400).json({ error: "tokenAddress is required" });
  if (amount === undefined || amount === null)
    return res.status(400).json({ error: "amount is required" });

  try {
    const wallet = new ethers.Wallet(privateKey, sharedClient.provider);
    const receipt = await sharedClient.withdraw(
      wallet,
      tokenAddress,
      Number(amount),
      {
        useOffchainVerify: useOffchainVerify === true,
        waitForFinalization: waitForFinalization !== false,
      },
    );
    return res.json({ success: true, receipt: serializeReceipt(receipt) });
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
 *   address      {string}  (optional) Address to query; defaults to wallet derived from privateKey
 */
app.post("/balance", async (req, res) => {
  const { privateKey, tokenAddress, address } = req.body;

  if (!privateKey)
    return res.status(400).json({ error: "privateKey is required" });
  if (!tokenAddress)
    return res.status(400).json({ error: "tokenAddress is required" });

  try {
    const wallet = new ethers.Wallet(privateKey, sharedClient.provider);
    const queryAddress = address || (await wallet.getAddress());
    const { privateKey: elgamalKey } = await sharedClient._deriveKeys(wallet);
    const balance = await sharedClient.getConfidentialBalance(
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
