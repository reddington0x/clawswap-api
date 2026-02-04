# ClawSwap Skill

## What is ClawSwap?

ClawSwap is a cross-chain swap and bridge API for AI agents. It enables agents to swap any token across any blockchain instantly.

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
POST https://api.clawswap.com/v1/quote
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
POST https://api.clawswap.com/v1/swap
Content-Type: application/json

{
  "quoteId": "uuid-from-quote",
  "walletAddress": "user-wallet-address"
}
```

The response includes the transaction details that the user's wallet needs to sign.

### 3. Track Status (Optional)

```
GET https://api.clawswap.com/v1/swap/{transactionHash}
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
