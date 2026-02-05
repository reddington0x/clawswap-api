require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { LRUCache } = require('lru-cache');
const { fetchQuote } = require('@mayanfinance/swap-sdk');
const { v4: uuidv4 } = require('uuid');

const app = express();

// ═══════════════════════════════════════════════════════════
// SECURITY MIDDLEWARE
// ═══════════════════════════════════════════════════════════

// Security headers
app.use(helmet());

// CORS - restrict to known origins
app.use(cors({
  origin: [
    'https://clawswap.tech',
    'https://www.clawswap.tech',
    'https://clawswap-api.fly.dev'
  ],
  methods: ['GET', 'POST'],
  credentials: false
}));

// Request size limits
app.use(express.json({ limit: '10kb' }));

// Rate limiting - quote endpoint
const quoteLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  message: { error: 'Too many quote requests. Try again in 1 minute.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting - swap endpoint
const swapLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 swaps per minute per IP
  message: { error: 'Too many swap requests. Try again in 1 minute.' },
  standardHeaders: true,
  legacyHeaders: false
});

// ═══════════════════════════════════════════════════════════
// CACHE CONFIGURATION
// ═══════════════════════════════════════════════════════════

// LRU cache with max size and TTL
const quoteCache = new LRUCache({
  max: 10000, // Max 10k quotes cached
  ttl: 5 * 60 * 1000, // 5 minutes
  updateAgeOnGet: false,
  updateAgeOnHas: false
});

// ═══════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════

// Validate environment variables
if (!process.env.REFERRER_SOLANA || !process.env.REFERRER_EVM) {
  console.error('❌ CRITICAL: REFERRER_SOLANA and REFERRER_EVM must be set');
  process.exit(1);
}

// Referrer addresses (from env only)
const REFERRER_ADDRESSES = {
  solana: process.env.REFERRER_SOLANA,
  evm: process.env.REFERRER_EVM,
  sui: process.env.REFERRER_SUI || process.env.REFERRER_SOLANA
};

// Max referral fees
const REFERRER_BPS = {
  solana: 100,  // 1% from Solana
  evm: 50,      // 0.5% from EVM
  default: 50
};

// Supported chains
const SUPPORTED_CHAINS = [
  'solana', 'ethereum', 'base', 'arbitrum', 'optimism',
  'polygon', 'bsc', 'avalanche', 'sui'
];

// ═══════════════════════════════════════════════════════════
// INPUT VALIDATION
// ═══════════════════════════════════════════════════════════

function validateQuoteRequest(params) {
  const { fromChain, toChain, fromToken, toToken, amount, slippageBps } = params;

  // Required fields
  if (!fromChain || !toChain || !fromToken || !toToken || !amount) {
    return { valid: false, error: 'Missing required fields' };
  }

  // Chain validation
  if (!SUPPORTED_CHAINS.includes(fromChain.toLowerCase())) {
    return { valid: false, error: `Unsupported fromChain: ${fromChain}` };
  }
  if (!SUPPORTED_CHAINS.includes(toChain.toLowerCase())) {
    return { valid: false, error: `Unsupported toChain: ${toChain}` };
  }

  // Amount validation
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0 || !isFinite(parsedAmount)) {
    return { valid: false, error: 'Amount must be a positive number' };
  }
  if (parsedAmount > 1e15) {
    return { valid: false, error: 'Amount exceeds maximum' };
  }

  // Slippage validation (if provided)
  if (slippageBps !== undefined) {
    const parsed = parseInt(slippageBps);
    if (isNaN(parsed) || parsed < 1 || parsed > 5000) {
      return { valid: false, error: 'slippageBps must be between 1 and 5000' };
    }
  }

  // Token address validation (basic)
  if (typeof fromToken !== 'string' || fromToken.length === 0) {
    return { valid: false, error: 'Invalid fromToken' };
  }
  if (typeof toToken !== 'string' || toToken.length === 0) {
    return { valid: false, error: 'Invalid toToken' };
  }

  return { valid: true };
}

// ═══════════════════════════════════════════════════════════
// ENDPOINTS
// ═══════════════════════════════════════════════════════════

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'ClawSwap API',
    version: '1.0.1',
    timestamp: new Date().toISOString()
  });
});

app.post('/v1/quote', quoteLimit, async (req, res) => {
  try {
    const { 
      fromChain,
      toChain, 
      fromToken,
      toToken,
      amount,
      slippageBps
    } = req.body;

    // Validate input
    const validation = validateQuoteRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: validation.error
      });
    }

    // Determine referral BPS
    const referrerBps = fromChain.toLowerCase() === 'solana' 
      ? REFERRER_BPS.solana 
      : REFERRER_BPS.evm;

    console.log(`[QUOTE] ${fromChain} → ${toChain} | ${amount} | Fee: ${referrerBps}bps`);

    // Fetch quote from Mayan
    const quotes = await fetchQuote({
      amount: parseFloat(amount),
      fromToken: fromToken,
      toToken: toToken,
      fromChain: fromChain.toLowerCase(),
      toChain: toChain.toLowerCase(),
      slippage: typeof slippageBps === 'number' ? slippageBps / 100 : 3,
      referrerBps: referrerBps
    });

    if (!quotes || quotes.length === 0) {
      return res.status(404).json({ 
        error: 'No routes found',
        message: 'No swap route available for this pair'
      });
    }

    const bestQuote = quotes[0];

    // Generate quote ID and cache
    const quoteId = uuidv4();
    const quoteData = {
      quote: bestQuote,
      timestamp: Date.now(),
      params: { fromChain, toChain, fromToken, toToken, amount, referrerBps }
    };
    
    quoteCache.set(quoteId, quoteData);

    // Return flattened quote
    res.json({
      quoteId,
      fromChain,
      toChain,
      fromToken: bestQuote.fromToken?.mint || fromToken,
      toToken: bestQuote.toToken?.mint || toToken,
      fromAmount: bestQuote.fromAmount || amount.toString(),
      toAmountMin: bestQuote.minAmountOut,
      estimatedToAmount: bestQuote.effectiveAmountOut || bestQuote.expectedAmountOut,
      priceImpact: bestQuote.priceImpact,
      estimatedDuration: bestQuote.duration,
      fee: `${referrerBps / 100}%`,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      route: `${fromChain} → ${toChain}`,
      rawQuote: bestQuote
    });

  } catch (error) {
    console.error('[QUOTE ERROR]', error.message);
    res.status(500).json({ 
      error: 'Quote generation failed',
      message: 'Unable to fetch quote. Please try again.',
      code: 'E001'
    });
  }
});

app.post('/v1/swap', swapLimit, async (req, res) => {
  try {
    const { quoteId } = req.body;

    if (!quoteId) {
      return res.status(400).json({ 
        error: 'Missing quoteId',
        message: 'quoteId is required'
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(quoteId)) {
      return res.status(400).json({
        error: 'Invalid quoteId',
        message: 'quoteId must be a valid UUID'
      });
    }

    const cached = quoteCache.get(quoteId);
    
    if (!cached) {
      return res.status(404).json({ 
        error: 'Quote not found or expired',
        message: 'Please request a new quote'
      });
    }

    const { quote, params } = cached;

    console.log(`[SWAP] ${params.fromChain} → ${params.toChain}`);

    // Return quote data for client-side execution
    // This is non-custodial: agents execute the swap themselves
    res.json({
      message: 'Quote ready for execution',
      swapId: quoteId,
      quote: quote,
      params: params,
      instructions: {
        step1: 'Sign the transaction with your wallet',
        step2: 'Broadcast the transaction to the blockchain',
        step3: 'Track status via swap explorer or your wallet'
      },
      note: 'ClawSwap does not execute swaps. Your agent must sign and broadcast.'
    });

  } catch (error) {
    console.error('[SWAP ERROR]', error.message);
    res.status(500).json({ 
      error: 'Swap request failed',
      message: 'Unable to process swap request',
      code: 'E002'
    });
  }
});

app.get('/v1/swap/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const cached = quoteCache.get(id);
    
    if (!cached) {
      return res.status(404).json({ 
        error: 'Swap not found',
        message: 'Quote ID not found or expired'
      });
    }

    res.json({
      swapId: id,
      status: 'pending',
      timestamp: new Date(cached.timestamp).toISOString(),
      params: cached.params,
      note: 'Track actual swap status on blockchain explorer'
    });

  } catch (error) {
    console.error('[STATUS ERROR]', error.message);
    res.status(500).json({ 
      error: 'Status check failed',
      code: 'E003'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: `Endpoint ${req.method} ${req.path} does not exist`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: 'An unexpected error occurred',
    code: 'E999'
  });
});

// ═══════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🦞 ClawSwap API v1.0.1 (secure)`);
  console.log(`📡 Listening on port ${PORT}`);
  console.log(`🔒 Security: helmet + rate limits + input validation`);
  console.log(`📦 Cache: LRU (max 10k quotes, 5min TTL)`);
  console.log(`✅ Non-custodial: Agents execute swaps client-side`);
});
