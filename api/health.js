module.exports = (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'ClawSwap API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    referrers: {
      solana: process.env.REFERRER_SOLANA ? '✓' : '✗',
      evm: process.env.REFERRER_EVM ? '✓' : '✗',
      sui: process.env.REFERRER_SUI ? '✓' : '✗'
    }
  });
};
