module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  try {
    // Test if we can even load the SDK
    const sdk = require('@mayanfinance/swap-sdk');
    
    res.json({
      status: 'ok',
      sdkLoaded: true,
      functions: Object.keys(sdk),
      nodeVersion: process.version,
      platform: process.platform,
      env: {
        hasReferrerSolana: !!process.env.REFERRER_SOLANA,
        hasReferrerEVM: !!process.env.REFERRER_EVM
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'SDK load failed',
      message: error.message,
      stack: error.stack
    });
  }
};
