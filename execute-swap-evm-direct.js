require('dotenv').config();
const { ethers } = require('ethers');
const fetch = require('cross-fetch');

async function executeEvmSwapDirect() {
  console.log('🦞 ClawSwap - Base → Solana (Direct API)\n');
  const startTime = Date.now();
  
  function logTime(step) {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    console.log(`[${elapsed}s] ${step}`);
  }

  const baseAddress = '0xf8E3A4EE5F5f138E6EbB9d46E010c3E3136e35C2';
  const privateKey = '0xf57f98030da2d5ba37a0a6deecc948c53b8f279bf135ac40340c55a84d850a8e';
  const destinationAddress = 'GaaXmrsC18pcvYwjaLCRtamKFxdMSfTCttfgh4ErM4Aj';

  logTime('✅ Wallet loaded: ' + baseAddress);
  console.log('📍 Destination (Solana):', destinationAddress);
  console.log('');

  try {
    // Connect to Base
    const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    const signer = new ethers.Wallet(privateKey, provider);
    
    logTime('🔌 Connected to Base RPC');

    // Get quote from Mayan API directly
    logTime('🔍 Fetching quote from Mayan API...');
    
    const quoteParams = {
      amount: 0.02,
      fromToken: '0x4200000000000000000000000000000000000006', // WETH on Base
      toToken: 'So11111111111111111111111111111111111111112', // SOL
      fromChain: 'base',
      toChain: 'solana',
      slippageBps: 300,
      referrerBps: 50,
      referrer: '0xf8E3A4EE5F5f138E6EbB9d46E010c3E3136e35C2'
    };

    const quoteUrl = 'https://price-api.mayan.finance/quote?' + new URLSearchParams({
      fromToken: quoteParams.fromToken,
      toToken: quoteParams.toToken,
      fromChain: quoteParams.fromChain,
      toChain: quoteParams.toChain,
      amount: quoteParams.amount.toString(),
      slippageBps: quoteParams.slippageBps.toString(),
      referrerBps: quoteParams.referrerBps.toString(),
      referrer: quoteParams.referrer
    });

    const quoteResponse = await fetch(quoteUrl);
    const quotes = await quoteResponse.json();
    const quote = quotes[0];

    logTime('✅ Quote received:');
    console.log('   Expected out:', quote.expectedAmountOut, 'SOL');
    console.log('   Min out:', quote.minAmountOut, 'SOL');
    console.log('');

    // Now build and send the transaction manually
    logTime('🚀 Building transaction...');
    
    // Get the swap transaction data from Mayan
    const swapUrl = 'https://swap-v2-api.mayan.finance/swap';
    const swapBody = {
      quote: quote,
      swapperAddress: baseAddress,
      destinationAddress: destinationAddress,
      referrerAddress: quoteParams.referrer,
      fromChain: quoteParams.fromChain
    };

    const swapResponse = await fetch(swapUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(swapBody)
    });

    const swapData = await swapResponse.json();
    console.log('Swap data:', JSON.stringify(swapData, null, 2));

    // If we get transaction data, send it
    if (swapData.transaction) {
      logTime('📤 Sending transaction to Base...');
      
      const tx = await signer.sendTransaction(swapData.transaction);
      
      logTime('⏳ Waiting for confirmation...');
      const receipt = await tx.wait();
      
      const totalTime = Math.floor((Date.now() - startTime) / 1000);
      
      console.log('');
      logTime('✅ TRANSACTION CONFIRMED!');
      console.log('');
      console.log('📝 Transaction Hash:', receipt.hash);
      console.log('   BaseScan:', `https://basescan.org/tx/${receipt.hash}`);
      console.log('');
      console.log(`⏱️  Total: ${totalTime} seconds`);
      
      return receipt.hash;
    } else {
      throw new Error('No transaction data from Mayan API: ' + JSON.stringify(swapData));
    }

  } catch (error) {
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    console.error('');
    logTime(`❌ Failed after ${totalTime}s: ${error.message}`);
    throw error;
  }
}

executeEvmSwapDirect()
  .then((hash) => {
    console.log('\n✅ Done! Hash:', hash);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error.message);
    process.exit(1);
  });
