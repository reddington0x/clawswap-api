require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { fetchQuote, swapFromSolana, swapFromEvm } = require('@mayanfinance/swap-sdk');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory quote cache
const quoteCache = new Map();

// Referrer addresses
const REFERRER_ADDRESSES = {
  solana: process.env.REFERRER_SOLANA,
  evm: process.env.REFERRER_EVM,
  sui: process.env.REFERRER_SUI
};

// Max referral fees
const REFERRER_BPS = {
  solana: 100,  // 1% from Solana
  evm: 50,      // 0.5% from EVM
  default: 50
};

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'ClawSwap API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    referrers: {
      solana: REFERRER_ADDRESSES.solana ? '✓' : '✗',
      evm: REFERRER_ADDRESSES.evm ? '✓' : '✗',
      sui: REFERRER_ADDRESSES.sui ? '✓' : '✗'
    }
  });
});

// Quote endpoint
app.post('/v1/quote', async (req, res) => {
  try {
    const { fromChain, toChain, fromToken, toToken, amount, slippage } = req.body;
    
    if (!fromChain || !toChain || !fromToken || !toToken || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const referrerBps = fromChain.toLowerCase() === 'solana' ? REFERRER_BPS.solana : REFERRER_BPS.evm;
    
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
    quoteCache.set(quoteId, { quote, timestamp: Date.now() });
    
    setTimeout(() => quoteCache.delete(quoteId), 5 * 60 * 1000);

    res.json({
      quoteId,
      quote,
      expiresIn: 300,
      feePercent: referrerBps / 100
    });
  } catch (error) {
    console.error('[QUOTE ERROR]', error);
    res.status(500).json({ error: 'Failed to fetch quote', message: error.message });
  }
});

// Swap endpoint
app.post('/v1/swap', async (req, res) => {
  try {
    const { quoteId, destinationAddress, sourceChain } = req.body;
    
    if (!quoteId || !destinationAddress) {
      return res.status(400).json({ error: 'Missing quoteId or destinationAddress' });
    }

    const cached = quoteCache.get(quoteId);
    if (!cached) {
      return res.status(404).json({ error: 'Quote not found or expired' });
    }

    const { quote } = cached;
    const referrerAddress = sourceChain?.toLowerCase() === 'solana' 
      ? REFERRER_ADDRESSES.solana 
      : REFERRER_ADDRESSES.evm;

    const swapTx = sourceChain?.toLowerCase() === 'solana'
      ? await swapFromSolana(quote, destinationAddress, referrerAddress)
      : await swapFromEvm(quote, destinationAddress, referrerAddress);

    res.json({
      swapId: swapTx.tracker || swapTx.hash || 'unknown',
      transaction: swapTx,
      explorerUrl: `https://explorer.mayan.finance/swap/${swapTx.tracker || swapTx.hash}`
    });
  } catch (error) {
    console.error('[SWAP ERROR]', error);
    res.status(500).json({ error: 'Failed to execute swap', message: error.message });
  }
});

// Status endpoint
app.get('/v1/swap/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    swapId: id,
    explorerUrl: `https://explorer.mayan.finance/swap/${id}`,
    message: 'Track your swap on Mayan Explorer'
  });
});

// Serve skill.md
app.get('/skill.md', (req, res) => {
  res.sendFile(__dirname + '/../public/skill.md');
});

module.exports = app;
