const { swapFromSolana, swapFromEvm } = require('@mayanfinance/swap-sdk');
const { cache } = require('./quote');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { quoteId, destinationAddress, sourceChain } = req.body;
    
    if (!quoteId || !destinationAddress) {
      return res.status(400).json({ error: 'Missing quoteId or destinationAddress' });
    }

    const cached = cache.get(quoteId);
    if (!cached) {
      return res.status(404).json({ error: 'Quote not found or expired' });
    }

    const { quote } = cached;
    const referrerAddress = sourceChain?.toLowerCase() === 'solana' 
      ? process.env.REFERRER_SOLANA 
      : process.env.REFERRER_EVM;

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
    res.status(500).json({ 
      error: 'Failed to execute swap', 
      message: error.message 
    });
  }
};
