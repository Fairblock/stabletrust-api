/**
 * demo.js — StableTrust server demo
 *
 * Walks through: deposit → check balance → transfer → withdraw
 *
 * Usage:
 *   node demo.js
 */
import "dotenv/config";
import axios from "axios";

// ─── CONFIG ──────────────────────────────────────────────────────────────────

const BASE_URL = process.env.SERVER_URL || "http://localhost:8080";

const SENDER_PRIVATE_KEY = process.env.SENDER_PRIVATE_KEY;
const RECIPIENT_ADDRESS = process.env.RECIPIENT_ADDRESS;
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

const DEPOSIT_AMOUNT = process.env.DEPOSIT_AMOUNT || "2000000";
const TRANSFER_AMOUNT = process.env.TRANSFER_AMOUNT || "1000000";
const WITHDRAW_AMOUNT = process.env.WITHDRAW_AMOUNT || "1000000";

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
  if (!SENDER_PRIVATE_KEY) throw new Error("SENDER_PRIVATE_KEY is required in .env");
  if (!RECIPIENT_ADDRESS) throw new Error("RECIPIENT_ADDRESS is required in .env");

  console.log("=== StableTrust Server Demo ===\n");

  // 1. Deposit
  console.log(`[1/4] Depositing ${DEPOSIT_AMOUNT} units into confidential account…`);
  const depositResult = await post("/deposit", {
    privateKey: SENDER_PRIVATE_KEY,
    tokenAddress: TOKEN_ADDRESS,
    amount: DEPOSIT_AMOUNT,
  });
  console.log(`  tx hash: ${depositResult.receipt?.hash ?? "(included in receipt)"}\n`);

  // 2. Check balance after deposit
  console.log("[2/4] Checking confidential balance after deposit…");
  const afterDeposit = await post("/balance", {
    privateKey: SENDER_PRIVATE_KEY,
    tokenAddress: TOKEN_ADDRESS,
  });
  printBalance(`address: ${afterDeposit.address}`, afterDeposit.balance);
  console.log();

  // 3. Transfer
  console.log(`[3/4] Transferring ${TRANSFER_AMOUNT} units to ${RECIPIENT_ADDRESS}…`);
  const transferResult = await post("/transfer", {
    privateKey: SENDER_PRIVATE_KEY,
    recipientAddress: RECIPIENT_ADDRESS,
    tokenAddress: TOKEN_ADDRESS,
    amount: TRANSFER_AMOUNT,
  });
  console.log(`  tx hash: ${transferResult.receipt?.hash ?? "(included in receipt)"}\n`);

  // 4. Withdraw
  console.log(`[4/4] Withdrawing ${WITHDRAW_AMOUNT} units back to public balance…`);
  const withdrawResult = await post("/withdraw", {
    privateKey: SENDER_PRIVATE_KEY,
    tokenAddress: TOKEN_ADDRESS,
    amount: WITHDRAW_AMOUNT,
  });
  console.log(`  tx hash: ${withdrawResult.receipt?.hash ?? "(included in receipt)"}\n`);

  // Final balance check
  console.log("[done] Final confidential balance:");
  const finalBalance = await post("/balance", {
    privateKey: SENDER_PRIVATE_KEY,
    tokenAddress: TOKEN_ADDRESS,
  });
  printBalance(`address: ${finalBalance.address}`, finalBalance.balance);

  console.log("\nDemo complete.");
}

main().catch((err) => {
  console.error("Demo failed:", err.message);
  process.exit(1);
});
