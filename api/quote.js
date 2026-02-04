const { fetchQuote } = require('@mayanfinance/swap-sdk');
const { v4: uuidv4 } = require('uuid');

// In-memory cache (simplified for serverless)
const cache = new Map();

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fromChain, toChain, fromToken, toToken, amount, slippage } = req.body;
    
    if (!fromChain || !toChain || !fromToken || !toToken || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const referrerBps = fromChain.toLowerCase() === 'solana' ? 100 : 50;
    
    const quote = await fetchQuote({
      amount: parseFloat(amount),
      fromToken,
      toToken,
      fromChain,
      toChain,
      slippage: slippage || 3,
      referrerBps
    });

    const quoteId = uuidv4();
    cache.set(quoteId, { quote, timestamp: Date.now() });

    res.json({
      quoteId,
      quote,
      expiresIn: 300,
      feePercent: referrerBps / 100
    });
  } catch (error) {
    console.error('[QUOTE ERROR]', error);
    res.status(500).json({ 
      error: 'Failed to fetch quote', 
      message: error.message 
    });
  }
};

// Export cache for other endpoints
module.exports.cache = cache;
