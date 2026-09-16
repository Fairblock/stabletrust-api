# Stabletrust for Private Agentic Finance

### Private payments for AI agents. One key. Zero traces.

Stabletrust enables AI agents to transact privately on EVM chains - shield tokens, transfer confidentially, withdraw silently. Balances are encrypted on-chain. No one can see what your agent holds or where it sends.

**Built for the private agent economy.**

---

## Quickstart

No SDK. No setup. Just POST.

```js
// Shield tokens into a confidential account
await fetch("https://stabletrust-api.fairblock.network/deposit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    privateKey: process.env.AGENT_KEY,
    tokenAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC
    amount: "10000000", // 10 USDC
    chainId: 84532, // Base Sepolia
  }),
});
```

That's it. Your agent now has a private balance no one can read.

---

## Agent Flow

```
EOA → [account/create] → Confidential Account → [deposit]  → shielded balance
                                              → [transfer] → Recipient
Recipient → [apply] → spendable → [withdraw] → EOA
```

1. **Create account** - provision a confidential account (idempotent). Required before an account can receive a transfer.
2. **Deposit** - shield ERC-20 tokens. Balance becomes encrypted on-chain.
3. **Transfer** - send privately to any address. Amount is invisible on-chain.
4. **Apply** - a recipient applies received funds, moving them from `pending` to `available` so they can be spent or withdrawn.
5. **Withdraw** - unshield back to public ERC-20 at any time.
6. **Balance** - check any account's decrypted balance. Read-only - sends no transaction.

---

## API

### `POST /account/create`

Provision your confidential account (idempotent). Required before an account can receive a transfer.

```js
const res = await fetch("https://stabletrust-api.fairblock.network/account/create", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    privateKey: process.env.AGENT_KEY,
    chainId: 84532,
  }),
});

const { address, created } = await res.json();
// { success: true, address: '0x...', created: true }  // created:false if it already existed
```

### `POST /deposit`

```js
const res = await fetch("https://stabletrust-api.fairblock.network/deposit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    privateKey: process.env.AGENT_KEY,
    tokenAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    amount: "10000000",
    chainId: 84532,
  }),
});

const { receipt } = await res.json();
// { hash: '0x...' }
```

### `POST /balance`

Read-only - decrypts and returns the balance without sending any transaction. Returns `exists: false` with zero balances if the account hasn't been created yet.

```js
const res = await fetch("https://stabletrust-api.fairblock.network/balance", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    privateKey: process.env.AGENT_KEY,
    tokenAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    chainId: 84532,
  }),
});

const { exists, balance } = await res.json();
// { exists: true, balance: { total: '10000000', available: '10000000', pending: '0' } }
```

### `POST /transfer`

```js
const res = await fetch("https://stabletrust-api.fairblock.network/transfer", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    privateKey: process.env.AGENT_KEY,
    recipientAddress: "0x...recipient",
    tokenAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    amount: "5000000", // 5 USDC
    chainId: 84532,
  }),
});

const { receipt } = await res.json();
// { hash: '0x...' }
```

### `POST /apply`

Apply received funds - moves a recipient's balance from `pending` to `available` so it can be spent or withdrawn.

```js
const res = await fetch("https://stabletrust-api.fairblock.network/apply", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    privateKey: process.env.AGENT_KEY,
    chainId: 84532,
  }),
});

const { tx } = await res.json();
// { success: true, message: 'Pending balance applied', tx: '0x...' }
```

### `POST /withdraw`

```js
const res = await fetch("https://stabletrust-api.fairblock.network/withdraw", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    privateKey: process.env.AGENT_KEY,
    tokenAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    amount: "5000000",
    chainId: 84532,
  }),
});

const { receipt } = await res.json();
// { hash: '0x...' }
```

---

## Parameters

**`/deposit`**

| Field                 | Type    | Required | Description                            |
| --------------------- | ------- | -------- | -------------------------------------- |
| `privateKey`          | string  | yes      | Agent wallet private key               |
| `tokenAddress`        | string  | yes      | ERC-20 token contract address          |
| `amount`              | string  | yes      | Amount in token base units             |
| `chainId`             | number  | yes      | Target network chain ID                |
| `waitForFinalization` | boolean | no       | Wait for tx finality (default: `true`) |

**`/balance`**

| Field          | Type   | Required | Description                                             |
| -------------- | ------ | -------- | ------------------------------------------------------- |
| `privateKey`   | string | yes      | Agent wallet private key (used for decryption)          |
| `tokenAddress` | string | yes      | ERC-20 token contract address                           |
| `chainId`      | number | yes      | Target network chain ID                                 |
| `address`      | string | no       | Address to query - defaults to wallet from `privateKey` |

**`/transfer`**

| Field                 | Type    | Required | Description                                     |
| --------------------- | ------- | -------- | ----------------------------------------------- |
| `privateKey`          | string  | yes      | Agent wallet private key                        |
| `recipientAddress`    | string  | yes      | Recipient Ethereum address                      |
| `tokenAddress`        | string  | yes      | ERC-20 token contract address                   |
| `amount`              | string  | yes      | Amount in token base units                      |
| `chainId`             | number  | yes      | Target network chain ID                         |
| `useOffchainVerify`   | boolean | no       | Off-chain proof verification (default: `false`) |
| `waitForFinalization` | boolean | no       | Wait for tx finality (default: `true`)          |

**`/withdraw`**

| Field                 | Type    | Required | Description                                     |
| --------------------- | ------- | -------- | ----------------------------------------------- |
| `privateKey`          | string  | yes      | Agent wallet private key                        |
| `tokenAddress`        | string  | yes      | ERC-20 token contract address                   |
| `amount`              | string  | yes      | Amount in token base units                      |
| `chainId`             | number  | yes      | Target network chain ID                         |
| `useOffchainVerify`   | boolean | no       | Off-chain proof verification (default: `false`) |
| `waitForFinalization` | boolean | no       | Wait for tx finality (default: `true`)          |

**`/account/create`**

| Field                 | Type    | Required | Description                                      |
| --------------------- | ------- | -------- | ------------------------------------------------ |
| `privateKey`          | string  | yes      | Agent wallet private key                         |
| `chainId`             | number  | yes      | Target network chain ID                          |
| `waitForFinalization` | boolean | no       | Wait for account finality (default: `true`)      |

**`/apply`**

| Field                 | Type    | Required | Description                            |
| --------------------- | ------- | -------- | -------------------------------------- |
| `privateKey`          | string  | yes      | Agent wallet private key               |
| `chainId`             | number  | yes      | Target network chain ID                |
| `waitForFinalization` | boolean | no       | Wait for tx finality (default: `true`) |

---

## Supported Chains

| Chain            | ID       | Type    |
| ---------------- | -------- | ------- |
| Arbitrum One     | 42161    | mainnet |
| Base Sepolia     | 84532    | testnet |
| Ethereum Sepolia | 11155111 | testnet |
| Arbitrum Sepolia | 421614   | testnet |
| Arc              | 5042002  | testnet |
| Stable           | 2201     | testnet |

> **Arbitrum One is mainnet.** Confidential transfers and withdrawals
> charge a small native-ETH protocol fee (~0.00004 ETH per transfer, ~0.00002 ETH
> per withdrawal) in addition to gas.

# stablepay-api
