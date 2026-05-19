/**
 * demo-arc.js — StableTrust server demo (Arc)
 *
 * Walks through: deposit → check balance → transfer → withdraw
 *
 * Usage:
 *   node demo-arc.js
 */
import "dotenv/config";
import axios from "axios";

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const BASE_URL = process.env.SERVER_URL || "http://localhost:3000";

const SENDER_PRIVATE_KEY = process.env.SENDER_PRIVATE_KEY;
const RECIPIENT_ADDRESS = process.env.RECIPIENT_ADDRESS;
const TOKEN_ADDRESS = "0x3600000000000000000000000000000000000000";

const DEPOSIT_AMOUNT = "100000";
const TRANSFER_AMOUNT = "50000";
const WITHDRAW_AMOUNT = "50000";
const CHAIN_ID = 5042002; // Arc Chain ID

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const http = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  validateStatus: () => true,
});

async function post(path, body) {
  const res = await http.post(path, body);
  if (!res.data?.success) {
    throw new Error(
      `${path} failed (HTTP ${res.status}): ${res.data?.error ?? JSON.stringify(res.data)}`,
    );
  }
  return res.data;
}

function printBalance(label, balance) {
  console.log(`  ${label}`);
  console.log(`    total:     ${balance.total}`);
  console.log(`    available: ${balance.available}`);
  console.log(`    pending:   ${balance.pending}`);
}

// ─── DEMO FLOW ────────────────────────────────────────────────────────────────

async function main() {
  if (!SENDER_PRIVATE_KEY)
    throw new Error("SENDER_PRIVATE_KEY is required in .env");
  if (!RECIPIENT_ADDRESS)
    throw new Error("RECIPIENT_ADDRESS is required in .env");
  if (TOKEN_ADDRESS === "YOUR_USDC_ADDRESS_HERE")
    throw new Error("USDC_ADDRESS is required in .env");

  console.log("=== StableTrust Server Demo (Arc) ===\n");
  console.log(`Using Chain ID: ${CHAIN_ID}`);
  console.log(`Using Token:    ${TOKEN_ADDRESS}\n`);

  // 1. Deposit
  console.log(
    `[1/4] Depositing ${DEPOSIT_AMOUNT} units into confidential account…`,
  );
  const depositResult = await post("/deposit", {
    privateKey: SENDER_PRIVATE_KEY,
    tokenAddress: TOKEN_ADDRESS,
    amount: DEPOSIT_AMOUNT,
    chainId: CHAIN_ID,
  });
  console.log(`  tx hash: ${depositResult.tx}\n`);

  // 2. Check balance after deposit
  console.log("[2/4] Checking confidential balance after deposit…");
  const afterDeposit = await post("/balance", {
    privateKey: SENDER_PRIVATE_KEY,
    tokenAddress: TOKEN_ADDRESS,
    chainId: CHAIN_ID,
  });
  printBalance(`address: ${afterDeposit.address}`, afterDeposit.balance);
  console.log();

  // 3. Transfer
  console.log(
    `[3/4] Transferring ${TRANSFER_AMOUNT} units to ${RECIPIENT_ADDRESS}…`,
  );
  const transferResult = await post("/transfer", {
    privateKey: SENDER_PRIVATE_KEY,
    recipientAddress: RECIPIENT_ADDRESS,
    tokenAddress: TOKEN_ADDRESS,
    amount: TRANSFER_AMOUNT,
    chainId: CHAIN_ID,
  });
  console.log(`  tx hash: ${transferResult.tx}\n`);

  // 4. Withdraw
  console.log(
    `[4/4] Withdrawing ${WITHDRAW_AMOUNT} units back to public balance…`,
  );
  const withdrawResult = await post("/withdraw", {
    privateKey: SENDER_PRIVATE_KEY,
    tokenAddress: TOKEN_ADDRESS,
    amount: WITHDRAW_AMOUNT,
    chainId: CHAIN_ID,
  });
  console.log(`  tx hash: ${withdrawResult.tx}\n`);

  // Final balance check
  console.log("[done] Final confidential balance:");
  const finalBalance = await post("/balance", {
    privateKey: SENDER_PRIVATE_KEY,
    tokenAddress: TOKEN_ADDRESS,
    chainId: CHAIN_ID,
  });
  printBalance(`address: ${finalBalance.address}`, finalBalance.balance);

  console.log("\nDemo complete.");
}

main().catch((err) => {
  console.error("Demo failed:", err.message);
  process.exit(1);
});
