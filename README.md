# StableTrust
### Private payments for AI agents. One key. Zero traces.

StableTrust enables AI agents to transact privately on EVM chains — shield tokens, transfer confidentially, withdraw silently. Balances are encrypted on-chain. No one can see what your agent holds or where it sends.

**Built for the private agent economy.**

---

## Quickstart

No SDK. No setup. Just POST.

```js
// Shield tokens into a confidential account
await fetch('https://stabletrust-api.fairblock.network/deposit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    privateKey: process.env.AGENT_KEY,
    tokenAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC
    amount: '10000000', // 10 USDC
  }),
})
```

That's it. Your agent now has a private balance no one can read.

---

## Agent Flow

```
EOA → [deposit] → Confidential Account → [transfer] → Recipient
                                        → [withdraw] → EOA
```

1. **Deposit** — shield ERC-20 tokens. Balance becomes encrypted on-chain.
2. **Transfer** — send privately to any address. Amount is invisible on-chain.
3. **Withdraw** — unshield back to public ERC-20 at any time.
4. **Balance** — your agent can always check its own decrypted balance.

---

## API

### `POST /deposit`

```js
const res = await fetch('https://stabletrust-api.fairblock.network/deposit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    privateKey: process.env.AGENT_KEY,
    tokenAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    amount: '10000000',
  }),
})

const { receipt } = await res.json()
// { hash: '0x...' }
```

### `POST /balance`

```js
const res = await fetch('https://stabletrust-api.fairblock.network/balance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    privateKey: process.env.AGENT_KEY,
    tokenAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  }),
})

const { balance } = await res.json()
// { total: '10000000', available: '10000000', pending: '0' }
```

### `POST /transfer`

```js
const res = await fetch('https://stabletrust-api.fairblock.network/transfer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    privateKey: process.env.AGENT_KEY,
    recipientAddress: '0x...recipient',
    tokenAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    amount: '5000000', // 5 USDC
  }),
})

const { receipt } = await res.json()
// { hash: '0x...' }
```

### `POST /withdraw`

```js
const res = await fetch('https://stabletrust-api.fairblock.network/withdraw', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    privateKey: process.env.AGENT_KEY,
    tokenAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    amount: '5000000',
  }),
})

const { receipt } = await res.json()
// { hash: '0x...' }
```

---

## Parameters

**`/deposit`**

| Field | Type | Required | Description |
|---|---|---|---|
| `privateKey` | string | yes | Agent wallet private key |
| `tokenAddress` | string | yes | ERC-20 token contract address |
| `amount` | string | yes | Amount in token base units |
| `waitForFinalization` | boolean | no | Wait for tx finality (default: `true`) |

**`/balance`**

| Field | Type | Required | Description |
|---|---|---|---|
| `privateKey` | string | yes | Agent wallet private key (used for decryption) |
| `tokenAddress` | string | yes | ERC-20 token contract address |
| `address` | string | no | Address to query — defaults to wallet from `privateKey` |

**`/transfer`**

| Field | Type | Required | Description |
|---|---|---|---|
| `privateKey` | string | yes | Agent wallet private key |
| `recipientAddress` | string | yes | Recipient Ethereum address |
| `tokenAddress` | string | yes | ERC-20 token contract address |
| `amount` | string | yes | Amount in token base units |
| `useOffchainVerify` | boolean | no | Off-chain proof verification (default: `false`) |
| `waitForFinalization` | boolean | no | Wait for tx finality (default: `true`) |

**`/withdraw`**

| Field | Type | Required | Description |
|---|---|---|---|
| `privateKey` | string | yes | Agent wallet private key |
| `tokenAddress` | string | yes | ERC-20 token contract address |
| `amount` | string | yes | Amount in token base units |
| `useOffchainVerify` | boolean | no | Off-chain proof verification (default: `false`) |
| `waitForFinalization` | boolean | no | Wait for tx finality (default: `true`) |

---

## Supported Chains

| Chain | ID |
|---|---|
| Base | 8453 |
| Base Sepolia | 84532 |
| Ethereum Sepolia | 11155111 |
| Arbitrum Sepolia | 421614 |
| Arc | 1244 |
| Stable | 2201 |
| Tempo | 42431 |
# stablepay-api
