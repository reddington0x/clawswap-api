require('dotenv').config();
const { fetchQuote } = require('@mayanfinance/swap-sdk');

async function testQuote() {
  console.log('🧪 Testing Mayan SDK quote...\n');
  
  try {
    const quote = await fetchQuote({
      amount: 1,
      fromToken: 'So11111111111111111111111111111111111111112', // SOL
      toToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',   // WETH
      fromChain: 'solana',
      toChain: 'ethereum',
      slippage: 3,
      referrerBps: 100 // 1%
    });

    console.log('✅ Quote successful!\n');
    console.log('Expected amount out:', quote.expectedAmountOut);
    console.log('Min amount out:', quote.minAmountOut);
    console.log('Route:', quote.routeType);
    console.log('\nFull quote:', JSON.stringify(quote, null, 2));
  } catch (error) {
    console.error('❌ Quote failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testQuote();
