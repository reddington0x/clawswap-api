const { fetchQuote } = require('@mayanfinance/swap-sdk');
const { v4: uuidv4 } = require('uuid');

// Simple in-memory cache
const cache = new Map();

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fromChain, toChain, fromToken, toToken, amount, slippage } = req.body;
    
    if (!fromChain || !toChain || !fromToken || !toToken || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['fromChain', 'toChain', 'fromToken', 'toToken', 'amount']
      });
    }

    const referrerBps = fromChain.toLowerCase() === 'solana' ? 100 : 50;
    
    // Fetch quote from Mayan
    const quotes = await fetchQuote({
      amount: parseFloat(amount),
      fromToken,
      toToken,
      fromChain: fromChain.toLowerCase(),
      toChain: toChain.toLowerCase(),
      slippage: slippage || 3,
      referrerBps
    });

    // Mayan returns an array of quotes, take the first (best) one
    const quote = Array.isArray(quotes) ? quotes[0] : quotes;
    
    if (!quote) {
      return res.status(500).json({ error: 'No quote available' });
    }

    const quoteId = uuidv4();
    cache.set(quoteId, { quote, timestamp: Date.now() });
    
    // Clean up old cache entries (older than 10 minutes)
    for (const [id, data] of cache.entries()) {
      if (Date.now() - data.timestamp > 10 * 60 * 1000) {
        cache.delete(id);
      }
    }

    res.json({
      quoteId,
      expectedAmountOut: quote.expectedAmountOut,
      minAmountOut: quote.minAmountOut,
      feePercent: referrerBps / 100,
      feeDollars: quote.referrerFeeUsd,
      route: quote.type,
      eta: `${quote.etaSeconds}s`,
      expiresIn: 300,
      quote
    });
  } catch (error) {
    console.error('[QUOTE ERROR]', error);
    res.status(500).json({ 
      error: 'Failed to fetch quote', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Export cache for other endpoints
module.exports.cache = cache;
