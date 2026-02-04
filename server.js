require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { fetchQuote, swapFromSolana, swapFromEvm } = require('@mayanfinance/swap-sdk');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory quote cache (use Redis in production)
const quoteCache = new Map();

// Referrer addresses (John's wallets)
const REFERRER_ADDRESSES = {
  solana: process.env.REFERRER_SOLANA || 'YOUR_SOLANA_WALLET',
  evm: process.env.REFERRER_EVM || 'YOUR_EVM_WALLET',
  sui: process.env.REFERRER_SUI || 'YOUR_SUI_WALLET'
};

// Max referral fees
const REFERRER_BPS = {
  solana: 100,  // 1% from Solana
  evm: 50,      // 0.5% from EVM (until Swift V2)
  default: 50
};

// ═══════════════════════════════════════════════════════════
// GET /health
// ═══════════════════════════════════════════════════════════
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'ClawSwap API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ═══════════════════════════════════════════════════════════
// POST /v1/quote
// Get swap quote with ClawSwap fee included
// ═══════════════════════════════════════════════════════════
app.post('/v1/quote', async (req, res) => {
  try {
    const { 
      fromChain,    // "solana", "ethereum", etc
      toChain, 
      fromToken,    // Token address or "native"
      toToken,
      amount,       // Amount in smallest unit (lamports, wei, etc)
      slippageBps   // Optional, defaults to "auto"
    } = req.body;

    // Validate required fields
    if (!fromChain || !toChain || !fromToken || !toToken || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['fromChain', 'toChain', 'fromToken', 'toToken', 'amount']
      });
    }

    // Determine referral BPS based on source chain
    const referrerBps = fromChain.toLowerCase() === 'solana' 
      ? REFERRER_BPS.solana 
      : REFERRER_BPS.evm;

    console.log(`[QUOTE] ${fromChain} → ${toChain} | Fee: ${referrerBps}bps`);

    // Fetch quote from Mayan with our referral fee
    const quotes = await fetchQuote({
      amountIn64: amount.toString(),
      fromToken: fromToken,
      toToken: toToken,
      fromChain: fromChain.toLowerCase(),
      toChain: toChain.toLowerCase(),
      slippageBps: slippageBps || "auto",
      referrer: REFERRER_ADDRESSES.solana,  // Always use Solana address
      referrerBps: referrerBps
    });

    if (!quotes || quotes.length === 0) {
      return res.status(404).json({ 
        error: 'No routes found',
        message: 'Mayan could not find a swap route for this pair'
      });
    }

    // Get best quote (first one)
    const bestQuote = quotes[0];

    // Generate quote ID and cache it
    const quoteId = uuidv4();
    quoteCache.set(quoteId, {
      quote: bestQuote,
      timestamp: Date.now(),
      params: { fromChain, toChain, fromToken, toToken, amount }
    });

    // Clean up old quotes (older than 5 minutes)
    const now = Date.now();
    for (const [id, data] of quoteCache.entries()) {
      if (now - data.timestamp > 300000) {
        quoteCache.delete(id);
      }
    }

    // Return quote with ClawSwap metadata
    res.json({
      quoteId,
      fromChain,
      toChain,
      fromToken,
      toToken,
      amountIn: amount,
      expectedAmountOut: bestQuote.expectedAmountOut,
      minAmountOut: bestQuote.minAmountOut,
      effectivePrice: bestQuote.effectivePrice,
      priceImpact: bestQuote.priceImpact,
      fee: `${referrerBps / 100}%`,
      feeBps: referrerBps,
      eta: bestQuote.eta || '60-90 seconds',
      route: bestQuote.type || 'auto',
      expiresAt: new Date(now + 300000).toISOString(),
      gasless: bestQuote.gasless || false
    });

  } catch (error) {
    console.error('[QUOTE ERROR]', error);
    res.status(500).json({ 
      error: 'Failed to fetch quote',
      message: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /v1/swap
// Execute swap using cached quote
// ═══════════════════════════════════════════════════════════
app.post('/v1/swap', async (req, res) => {
  try {
    const { 
      quoteId,
      walletAddress,      // User's wallet on source chain
      destWalletAddress   // Optional: destination wallet (defaults to same)
    } = req.body;

    if (!quoteId || !walletAddress) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['quoteId', 'walletAddress']
      });
    }

    // Retrieve cached quote
    const cached = quoteCache.get(quoteId);
    if (!cached) {
      return res.status(404).json({ 
        error: 'Quote not found or expired',
        message: 'Please request a new quote'
      });
    }

    const { quote, params } = cached;
    const destinationWallet = destWalletAddress || walletAddress;

    console.log(`[SWAP] ${params.fromChain} → ${params.toChain}`);

    // Return transaction info
    // NOTE: For actual execution, the client needs to:
    // 1. Get this response
    // 2. Sign the transaction with their wallet
    // 3. Broadcast it to the blockchain
    // We don't hold keys, so we can't execute for them

    res.json({
      swapId: quoteId,
      status: 'ready',
      message: 'Transaction ready. Sign and broadcast with your wallet.',
      fromChain: params.fromChain,
      toChain: params.toChain,
      sourceWallet: walletAddress,
      destWallet: destinationWallet,
      quote: {
        amountIn: params.amount,
        expectedOut: quote.expectedAmountOut,
        minOut: quote.minAmountOut
      },
      // Return the raw quote data so SDK can build transaction
      mayanQuote: quote,
      instructions: {
        solana: 'Use @mayanfinance/swap-sdk swapFromSolana() with this quote',
        evm: 'Use @mayanfinance/swap-sdk swapFromEvm() with this quote'
      }
    });

  } catch (error) {
    console.error('[SWAP ERROR]', error);
    res.status(500).json({ 
      error: 'Failed to prepare swap',
      message: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════
// GET /v1/swap/:id
// Track swap status via Mayan Explorer API
// ═══════════════════════════════════════════════════════════
app.get('/v1/swap/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Query Mayan Explorer API
    const response = await fetch(
      `https://explorer-api.mayan.finance/v3/swap/trx/${id}`
    );
    
    if (!response.ok) {
      return res.status(404).json({ 
        error: 'Swap not found',
        swapId: id
      });
    }

    const data = await response.json();

    res.json({
      swapId: id,
      status: data.clientStatus, // INPROGRESS, COMPLETED, REFUNDED
      fromChain: data.sourceChain,
      toChain: data.destChain,
      details: data
    });

  } catch (error) {
    console.error('[STATUS ERROR]', error);
    res.status(500).json({ 
      error: 'Failed to fetch swap status',
      message: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════
// Start server
// ═══════════════════════════════════════════════════════════
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🦞 ClawSwap API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`💰 Referral fees: ${REFERRER_BPS.solana}bps (Solana), ${REFERRER_BPS.evm}bps (EVM)`);
});
