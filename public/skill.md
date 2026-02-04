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

**If your agent doesn't have wallet capabilities, ClawSwap will NOT work.** You need autonomous wallet control to use this service. See the [Wallet Setup Guide](https://clawswap-api.fly.dev/wallet-setup.md) to generate wallets for your agent.

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

## Autonomous Execution (THE REAL CLAWSWAP)

ClawSwap is built for agents with wallets. Here's how to execute swaps autonomously using Mayan SDK:

### Prerequisites

```bash
npm install @mayanfinance/swap-sdk @solana/web3.js ethers
```

### Complete Autonomous Swap Example

```javascript
const { fetchQuote, swapFromSolana } = require('@mayanfinance/swap-sdk');
const { Keypair, Connection } = require('@solana/web3.js');

async function autonomousSwap() {
  // 1. Load your agent's Solana wallet
  const wallet = Keypair.fromSecretKey(/* your 64-byte secret key */);
  
  // Use fast RPC with optimized commitment for speed
  const connection = new Connection(
    'https://api.mainnet-beta.solana.com', // Or use Helius/Ankr for faster
    { commitment: 'confirmed' } // Don't wait for finalized (saves 2-5s)
  );
  
  // 2. Get quote from Mayan (optimized for speed)
  const quotes = await fetchQuote({
    amount: 0.1,  // or use amountIn64 for token decimals
    fromToken: 'So11111111111111111111111111111111111111112', // SOL
    toToken: '0x4200000000000000000000000000000000000006',   // WETH on Base
    fromChain: 'solana',
    toChain: 'base',
    slippageBps: 300,  // 3% slippage (lower = faster execution)
    referrerBps: 100,  // 1% fee to ClawSwap creator
    referrer: '58fgjE89vUmcLn48eZb9QM7Vu4YB9sTcHUiSyYbCkMP4'
  });
  
  const quote = quotes[0];  // Use best quote
  
  // 3. Execute swap with your wallet
  const signTransaction = async (tx) => {
    tx.sign([wallet]);
    return tx;
  };
  
  const referrerAddresses = {
    solana: '58fgjE89vUmcLn48eZb9QM7Vu4YB9sTcHUiSyYbCkMP4',
    evm: '0xf8E3A4EE5F5f138E6EbB9d46E010c3E3136e35C2'
  };
  
  const signature = await swapFromSolana(
    quote,
    wallet.publicKey.toBase58(),      // Your agent's source wallet
    wallet.publicKey.toBase58(),      // Destination (can be different)
    referrerAddresses,                // ClawSwap fee wallets
    signTransaction,                  // Your signing function
    connection,                       // Solana RPC connection
    undefined,                        // extraRpcs (optional parallel RPCs)
    {
      skipPreflight: false,           // Keep for safety
      preflightCommitment: 'confirmed', // Faster than finalized
      maxRetries: 2                   // Reduce for speed
    }
  );
  
  console.log('✅ Swap executed!');
  console.log('Signature:', signature);
  console.log('Track:', `https://explorer.mayan.finance/swap/${signature}`);
  
  return signature;
}
```

## Key Parameters Explained

**From ClawSwap Quote API:**
- `quoteId` - Use to retrieve cached quote
- `expectedAmountOut` - What you'll receive (WRAPPED if native asset!)
- `minAmountOut` - Minimum with slippage
- `referrerFeeUsd` - Fee going to ClawSwap creator

**For Mayan SDK:**
- `slippageBps` - Slippage tolerance (300 = 3%)
- `referrerBps` - Fee percentage (100 = 1%)
- `referrer` - ClawSwap creator's wallet (gets the fee)
- `referrerAddresses` - Object with `{solana, evm, sui}` addresses

### Minimum Requirements for Autonomous Swaps

✅ **Your agent MUST have:**
1. Private key (Solana: 64-byte Uint8Array or base58 string)
2. Sufficient balance (swap amount + ~0.01 SOL gas)
3. RPC connection to blockchain
4. Signing function that signs transactions

✅ **Slippage tolerance:**
- Minimum: 50 bps (0.5%)
- Recommended: 300 bps (3%) ← **BEST for speed + price**
- For small amounts (<$10): 500+ bps (slower but safer)
- Note: Lower slippage = faster execution (auction completes quicker)

✅ **Minimum swap amounts:**
- SOL: 0.01+ (lower amounts may fail due to gas/slippage)
- Stablecoins: $5+ recommended
- Other tokens: Check liquidity first

### Error Handling

**Common errors:**
- `0x1788` (Jupiter error) = Slippage exceeded or insufficient liquidity
  - Solution: Increase slippageBps or swap larger amount
- `Insufficient funds` = Need more SOL for gas
  - Solution: Add 0.01-0.05 SOL to wallet
- `Transaction simulation failed` = Price moved too much
  - Solution: Get fresh quote and retry

### Testing Your Agent

```javascript
// Test with small amount first!
const testQuote = await fetchQuote({
  amount: 0.01,  // Start small
  fromToken: 'So11111111111111111111111111111111111111112',
  toToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',  // USDC on Base
  fromChain: 'solana',
  toChain: 'base',
  slippageBps: 500,  // Higher slippage for small amounts
  referrerBps: 100,
  referrer: '58fgjE89vUmcLn48eZb9QM7Vu4YB9sTcHUiSyYbCkMP4'
});

// Verify quote looks good before executing
console.log('Expected out:', testQuote[0].expectedAmountOut);
console.log('Fee to ClawSwap:', testQuote[0].referrerFeeUsd);
```

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
