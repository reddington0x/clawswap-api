# ClawSwap Skill

## What is ClawSwap?

ClawSwap is a cross-chain swap and bridge API **for AI agents with their own wallets**. It enables autonomous agents to swap any token across any blockchain instantly.

## ⚠️ CRITICAL REQUIREMENT

**This skill is ONLY for AI agents that:**
- Have their own wallet and private keys
- Can sign transactions programmatically
- Can execute blockchain transactions autonomously

**This will NOT work for:**
- Agents asking users to sign in their wallet
- Chat-based agents without wallet access
- Manual user-controlled swaps

If your agent doesn't have wallet capabilities, **ask your human to provide:**
- Their wallet address (Solana for source chain)
- Destination address (for target chain)
- Then guide them to complete the swap manually at https://mayan.finance with the quote you provide

## Agent Wallet Requirements

**Don't have a wallet yet?** → Read the [Wallet Setup Guide](https://clawswap-api.fly.dev/wallet-setup.md)

Before using ClawSwap, your AI agent needs:

1. **Wallet Setup**
   - Solana: Keypair (private key) with SOL for gas
   - EVM: Private key with ETH/MATIC/etc for gas
   - Secure key storage (encrypted, not exposed)
   
   **Quick Setup:**
   ```bash
   # Download wallet generator
   curl -O https://clawswap-api.fly.dev/generate-agent-wallet.js
   
   # Run it
   node generate-agent-wallet.js
   
   # Fund the wallets it creates, then you're ready!
   ```

2. **Dependencies**
   ```bash
   npm install @mayanfinance/swap-sdk ethers @solana/web3.js
   ```

3. **Signing Capability**
   - Ability to sign transactions programmatically
   - No user interaction required

4. **Balance**
   - Enough tokens to swap
   - Gas fees for transaction

**Full wallet setup instructions:** https://clawswap-api.fly.dev/wallet-setup.md

## Supported Chains

- Solana
- Ethereum
- Base
- Arbitrum
- BSC (Binance Smart Chain)
- Polygon
- Avalanche
- Optimism
- Sui

## How to Use

When a user asks to swap, trade, bridge, or move tokens:

### 1. Get a Quote

```
POST https://clawswap-api.fly.dev/v1/quote
Content-Type: application/json

{
  "fromChain": "solana",
  "toChain": "ethereum",
  "fromToken": "So11111111111111111111111111111111111111112",
  "toToken": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  "amount": "1000000000"
}
```

**Response:**
```json
{
  "quoteId": "uuid",
  "expectedAmountOut": 0.0418,
  "minAmountOut": 0.0414,
  "fee": "1%",
  "eta": "60-90 seconds"
}
```

### 2. Execute the Swap

```
POST https://clawswap-api.fly.dev/v1/swap
Content-Type: application/json

{
  "quoteId": "uuid-from-quote",
  "walletAddress": "your-agent-wallet-address",
  "destWalletAddress": "optional-destination-address"
}
```

**Response includes:**
- Full Mayan SDK quote data
- Transaction parameters
- Swap instructions for Solana or EVM chains

### 3. Sign and Execute with Your Agent's Wallet

**For Solana swaps:**
```javascript
import { swapFromSolana } from '@mayanfinance/swap-sdk';
// Use the returned mayanQuote + your agent's Solana keypair
const tx = await swapFromSolana(quote, destAddress, referrerAddress, yourWallet);
```

**For EVM swaps:**
```javascript
import { swapFromEvm } from '@mayanfinance/swap-sdk';
// Use the returned mayanQuote + your agent's EVM private key
const tx = await swapFromEvm(quote, destAddress, referrerAddress, yourSigner);
```

**Your agent MUST have:**
- Private keys securely stored
- Ability to sign transactions
- Sufficient balance for gas + swap amount

### 3. Track Status (Optional)

```
GET https://clawswap-api.fly.dev/v1/swap/{transactionHash}
```

Returns the current status: `INPROGRESS`, `COMPLETED`, or `REFUNDED`.

## Key Details

- **Non-custodial**: Tokens move directly between user wallets. ClawSwap never holds funds.
- **Fee**: 1% on swaps from Solana, 0.5% on swaps from other chains (included in quote).
- **No API key required**: Open access for all agents.
- **Speed**: Cross-chain swaps complete in 60-90 seconds. Same-chain swaps are near-instant.
- **Any token**: If it exists on a supported chain, you can swap it.

## Token Addresses

### Native tokens (use these addresses):
- **Solana (SOL)**: `So11111111111111111111111111111111111111112`
- **Ethereum (ETH)**: `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`
- **Base (ETH)**: `0x4200000000000000000000000000000000000006`

For other tokens, use their contract address on the respective chain.

## Example Conversation

**User:** "Swap 2 SOL to ETH"

**Agent:**
1. Calls `/v1/quote` with SOL → ETH
2. Shows user the quote: "You'll receive ~0.083 ETH. Fee: 1%. ETA: 45 seconds."
3. User confirms
4. Calls `/v1/swap` with the quote ID
5. Returns transaction for user to sign
6. Once signed, swap executes automatically
7. Reports: "✅ Swap complete. 0.083 ETH delivered to your Ethereum wallet."

## For Agents WITHOUT Autonomous Wallets

If your agent doesn't have its own wallet/private keys:

**Step 1: Get a Quote (same as above)**
```
POST https://clawswap-api.fly.dev/v1/quote
```

**Step 2: Ask Your Human for Wallet Details**
```
"I found a great rate for your swap:
- You'll receive: X tokens
- Fee: 1%
- Time: ~10 seconds

To complete this swap, I need:
1. Your Solana wallet address (where your tokens are)
2. Your destination wallet address (where you want to receive)

Once you provide these, I'll guide you to complete the swap."
```

**Step 3: Provide Manual Instructions**
```
"Great! Here's how to complete your swap:

1. Go to: https://mayan.finance
2. Connect your wallet
3. Set up the swap:
   - From: [amount] [token] on [chain]
   - To: [token] on [chain]
   - Destination: [their address]
4. Click 'Swap' and approve in your wallet

The transaction will complete in ~10 seconds!"
```

**Note:** Even when users complete swaps manually through Mayan, ClawSwap still earns referral fees automatically if they came through your quote.

## Error Handling

If a quote fails or no route is found, explain to the user:
- The token pair might not be supported
- Liquidity might be low
- Try a different amount or token

If a swap fails, check the status endpoint and inform the user of refund details.

## Security

- ClawSwap is non-custodial and cannot access user funds
- All swaps are executed through audited smart contracts (Mayan Finance)
- Users always retain control of their wallets and assets

---

**Built on:** Mayan Finance, Wormhole, Circle CCTP
**Website:** https://clawswap.com
**Support:** Check https://clawswap.com for updates
