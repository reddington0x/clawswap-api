# 🦞 ClawSwap API

**Any-chain swap & bridge for AI agents.**

One skill file. Any token. Any chain. Deploy and disappear.

---

## What is ClawSwap?

ClawSwap is a cross-chain swap API built specifically for **autonomous AI agents**. It's a thin wrapper around Mayan Finance that:

- ✅ Delivers **native tokens** by default (SOL, ETH, etc.)
- ✅ Works across **9+ blockchains** (Solana, Ethereum, Base, Arbitrum, BSC, Polygon, Avalanche, Optimism, Sui)
- ✅ Earns you **passive income** (1% from Solana, 0.5% from EVM)
- ✅ Costs **$2-5/month** to run
- ✅ Scales to **50,000+ swaps/day** before upgrades needed

**Built for:** AI agents with their own wallets (not chat UIs)

---

## Live URLs

- **Website:** https://clawswap.tech
- **API:** https://clawswap-api.fly.dev
- **Skill File:** https://clawswap.tech/skill.md

---

## Quick Start for Agents

```bash
# 1. Generate wallets
curl -O https://clawswap-api.fly.dev/generate-agent-wallet.js
npm install @solana/web3.js ethers
node generate-agent-wallet.js

# 2. Fund wallets (Solana: 0.1+ SOL, EVM: 0.02+ ETH)

# 3. Install SDK
npm install @mayanfinance/swap-sdk

# 4. Swap!
const { fetchQuote, swapFromSolana } = require('@mayanfinance/swap-sdk');
// See skill.md for full example
```

---

## Features

### ✅ Native Token Delivery
- Uses zero address (`0x0000...0000`) for native SOL, ETH, etc.
- No wrapping/unwrapping needed
- Just works™

### ✅ Fast
- Quote: ~2 seconds
- Execution: ~10-15 seconds
- Total: ~15-30 seconds for cross-chain swaps

### ✅ Profitable
- 1% fee on Solana swaps
- 0.5% fee on EVM swaps
- Revenue paid directly to your referrer wallets

### ✅ Scalable
- Stateless architecture
- No database
- Auto-scales on Fly.io
- 5,000+ swaps/day on current setup

---

## Architecture

```
AI Agent
    ↓
ClawSwap Skill.md (Documentation)
    ↓
Mayan SDK (Direct integration)
    ↓
Mayan Swift Protocol (Intent-based execution)
    ↓
Native tokens delivered to destination
```

**We don't run swaps.** Mayan's driver network does. We just provide:
1. Clear documentation for agents
2. Wallet generation tools
3. Code examples that work

---

## Tech Stack

- **Frontend:** Static HTML (Vercel)
- **Backend:** Express API (Fly.io)
- **Swaps:** Mayan Finance SDK
- **RPC:** Helius Premium (free tier)
- **Cost:** $2-5/month
- **Revenue:** Unlimited

---

## Deployment

### API (Fly.io)
```bash
cd clawswap-api
flyctl deploy --ha=false
```

### Website (Vercel)
```bash
cd clawswap-website
git push origin main  # Auto-deploys
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full guide.

---

## Files

```
clawswap-api/
├── server.js              # Express API (not used by agents)
├── public/
│   ├── skill.md           # Main documentation for agents
│   ├── wallet-setup.md    # Wallet generation guide
│   └── generate-agent-wallet.js  # Wallet generator script
├── DEPLOYMENT.md          # Ops guide
└── README.md              # This file

clawswap-website/
├── index.html             # Landing page
└── skill.md               # Copy of skill.md
```

---

## Revenue Model

**Costs:**
- Fly.io: $2-5/month (auto-start/stop)
- Helius RPC: Free (100k requests/day)
- Domain: $12/year
- **Total: ~$10-15/month**

**Revenue:**
- 1,000 swaps/day @ $100 avg volume = **$1,000/day**
- 10,000 swaps/day @ $100 avg volume = **$10,000/day**

**Profit margin:** ~99.9%

---

## Key Insights

### Why This Works

1. **Built for agents, not humans**
   - No UI complexity
   - Just SDK + clear docs
   - Agents can execute autonomously

2. **Deploy & disappear**
   - No database = no maintenance
   - Stateless = auto-scales
   - Mayan handles execution = no bottlenecks

3. **Fair fees**
   - We just pass through to Mayan
   - Add 0.5-1% referrer fee
   - Competitive with manual swaps

### What We Learned

- **Zero address = native tokens** (0x0000...0000 works universally)
- **Minimum amounts matter** (~0.011 SOL minimum)
- **Speed is real** (10-15 sec actual vs 60-90 sec advertised)
- **Agents need wallets** (not API endpoints for users to call)

---

## Testing

Run edge tests:
```bash
cd clawswap-api
node test-edge-cases.js
```

Results:
- ✅ Large amounts (100 SOL)
- ✅ Stablecoins (USDC)
- ✅ EVM → EVM
- ⚠️ Min amount: 0.011 SOL
- ⚠️ Slippage must be > 0

---

## Support

- **Docs:** https://clawswap.tech/skill.md
- **Issues:** Create an issue in this repo
- **Updates:** Check commit history

---

## License

MIT - Do whatever you want with it.

---

## Credits

Built by [@reddington0x](https://github.com/reddington0x)

Powered by:
- [Mayan Finance](https://mayan.finance) - Cross-chain swap protocol
- [Helius](https://helius.dev) - Solana RPC
- [Fly.io](https://fly.io) - Serverless hosting
- [Vercel](https://vercel.com) - Static hosting

---

**🦞 ClawSwap - Your agent. Every chain.**
