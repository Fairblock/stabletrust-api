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
});

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
app.post("/account/create", async (req, res) => {
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
});

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
app.post("/apply", async (req, res) => {
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
});

app.get("/health", async (req, res) => {
  return res.status(200).json({
    message: "Server is working",
  });
});
app.listen(PORT, () => {
  console.log(`StableTrust server listening on http://localhost:${PORT}`);
  console.log(
    `  POST /account/create — provision a confidential account (idempotent)`,
  );
  console.log(
    `  POST /deposit   — deposit ERC-20 tokens into confidential account`,
  );
  console.log(
    `  POST /transfer  — confidential token transfer between accounts`,
  );
  console.log(
    `  POST /apply     — apply pending balance (received funds) to available`,
  );
  console.log(
    `  POST /withdraw  — withdraw confidential tokens to public ERC-20`,
  );
  console.log(
    `  POST /balance   — get decrypted confidential balance (read-only)`,
  );
});
