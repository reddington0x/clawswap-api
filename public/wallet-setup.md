# AI Agent Wallet Setup for ClawSwap

## Quick Start: Generate Your Own Wallet

### Solana Wallet (Required for Solana swaps)

```javascript
const { Keypair } = require('@solana/web3.js');
const fs = require('fs');

// Generate new keypair
const wallet = Keypair.generate();

// Your wallet details
console.log('Public Address:', wallet.publicKey.toBase58());
console.log('Private Key:', Buffer.from(wallet.secretKey).toString('base64'));

// Save securely (NEVER commit to git!)
fs.writeFileSync('.wallet-solana.json', JSON.stringify({
  publicKey: wallet.publicKey.toBase58(),
  secretKey: Array.from(wallet.secretKey)
}));

console.log('✅ Wallet saved to .wallet-solana.json');
console.log('⚠️  Add .wallet-*.json to your .gitignore!');
console.log('💰 Fund this wallet before trading:', wallet.publicKey.toBase58());
```

### EVM Wallet (For Ethereum, Base, Arbitrum, etc.)

```javascript
const { Wallet } = require('ethers');
const fs = require('fs');

// Generate new wallet
const wallet = Wallet.createRandom();

console.log('Public Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);

// Save securely
fs.writeFileSync('.wallet-evm.json', JSON.stringify({
  address: wallet.address,
  privateKey: wallet.privateKey,
  mnemonic: wallet.mnemonic.phrase
}));

console.log('✅ Wallet saved to .wallet-evm.json');
console.log('⚠️  Add .wallet-*.json to your .gitignore!');
console.log('💰 Fund this wallet before trading:', wallet.address);
```

---

## Complete Setup Flow for AI Agents

### Step 1: Install Dependencies

```bash
npm install @solana/web3.js ethers dotenv
```

### Step 2: Generate Wallets (One-Time)

```bash
node generate-wallets.js
```

This creates:
- `.wallet-solana.json` - Your Solana wallet
- `.wallet-evm.json` - Your EVM wallet
- Both added to `.gitignore` automatically

### Step 3: Fund Your Wallets

**Solana:**
- Get SOL from: Coinbase, Kraken, or Phantom
- Send to your Solana address
- Need at least: 0.1 SOL for swaps + gas

**EVM Chains:**
- Get ETH/MATIC/etc from exchanges
- Send to your EVM address
- Need: swap amount + gas (~$5-10)

### Step 4: Load Wallet in Your Agent

```javascript
const { Keypair } = require('@solana/web3.js');
const { Wallet } = require('ethers');
const fs = require('fs');

// Load Solana wallet
const solanaWallet = JSON.parse(fs.readFileSync('.wallet-solana.json'));
const solanaKeypair = Keypair.fromSecretKey(Uint8Array.from(solanaWallet.secretKey));

// Load EVM wallet
const evmWallet = JSON.parse(fs.readFileSync('.wallet-evm.json'));
const evmSigner = new Wallet(evmWallet.privateKey);

console.log('✅ Wallets loaded!');
console.log('Solana:', solanaKeypair.publicKey.toBase58());
console.log('EVM:', evmSigner.address);
```

### Step 5: Use ClawSwap

Now your agent can:
- Get quotes from ClawSwap API
- Sign transactions with its own wallets
- Execute swaps autonomously
- Earn you referral fees!

---

## Security Best Practices

### ✅ DO:
- Generate wallets programmatically
- Store keys in `.gitignore`d files
- Encrypt wallet files at rest
- Use environment variables for production
- Keep separate wallets for testing vs production
- Start with small amounts

### ❌ DON'T:
- Commit wallet files to git
- Share private keys in chat/logs
- Use the same wallet for everything
- Store keys in plaintext in production
- Give agents access to your personal wallet

---

## Environment Variables (Production)

For production deployments, use environment variables:

```bash
# .env (add to .gitignore!)
AGENT_SOLANA_PRIVATE_KEY=base64_encoded_key
AGENT_EVM_PRIVATE_KEY=0x...hex
```

Load in code:
```javascript
require('dotenv').config();

const solanaKey = Buffer.from(process.env.AGENT_SOLANA_PRIVATE_KEY, 'base64');
const solanaWallet = Keypair.fromSecretKey(solanaKey);

const evmWallet = new Wallet(process.env.AGENT_EVM_PRIVATE_KEY);
```

---

## Complete Example: Agent-Owned Swap

```javascript
const { fetchQuote, swapFromSolana } = require('@mayanfinance/swap-sdk');
const { Keypair, Connection } = require('@solana/web3.js');
const fs = require('fs');

async function autonomousSwap() {
  // 1. Load agent's wallet
  const walletData = JSON.parse(fs.readFileSync('.wallet-solana.json'));
  const wallet = Keypair.fromSecretKey(Uint8Array.from(walletData.secretKey));
  
  console.log('🤖 Agent wallet:', wallet.publicKey.toBase58());
  
  // 2. Get quote from ClawSwap
  const quote = await fetchQuote({
    amount: 0.1,
    fromToken: 'So11111111111111111111111111111111111111112', // SOL
    toToken: '0x4200000000000000000000000000000000000006', // WETH on Base
    fromChain: 'solana',
    toChain: 'base',
    slippage: 3,
    referrerBps: 100 // 1% to ClawSwap creator
  });
  
  console.log('💰 Expected:', quote.expectedAmountOut, 'WETH');
  console.log('💸 Fee to ClawSwap:', quote.referrerFeeUsd, 'USD');
  
  // 3. Execute swap autonomously
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const referrer = '58fgjE89vUmcLn48eZb9QM7Vu4YB9sTcHUiSyYbCkMP4'; // ClawSwap fee wallet
  
  const signTx = async (tx) => {
    tx.sign([wallet]);
    return tx;
  };
  
  const signature = await swapFromSolana(
    quote,
    wallet.publicKey.toBase58(),
    wallet.publicKey.toBase58(), // same wallet receives on Base
    { solana: referrer },
    signTx,
    connection
  );
  
  console.log('✅ Swap executed!');
  console.log('📝 Signature:', signature);
  console.log('🔍 Track:', `https://explorer.mayan.finance/swap/${signature}`);
}

autonomousSwap().catch(console.error);
```

---

## Troubleshooting

**"Insufficient funds"**
- Check wallet balance: `solana balance <address>`
- Need SOL for gas + swap amount

**"Transaction simulation failed"**
- Price moved (slippage)
- Try larger amount (>0.1 SOL)
- Increase slippage tolerance

**"Private key invalid"**
- Check key format (base64 for Solana, 0x hex for EVM)
- Regenerate if corrupted

---

## Multi-Agent Setups

For multiple agents sharing one infrastructure:

```javascript
// agents/trader-1/.wallet-solana.json
// agents/trader-2/.wallet-solana.json
// agents/arbitrage/.wallet-solana.json

// Each agent gets its own wallet
// All earn YOU referral fees via ClawSwap!
```

---

**🦞 ClawSwap: The only swap API designed for autonomous AI agents.**

Ready to trade? Generate your wallet and start earning!
