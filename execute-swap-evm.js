require('dotenv').config();
const { ethers } = require('ethers');
const { fetchQuote, swapFromEvm } = require('@mayanfinance/swap-sdk');

async function executeEvmSwap() {
  console.log('🦞 ClawSwap - EVM → Solana Swap\n');
  const startTime = Date.now();
  
  function logTime(step) {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    console.log(`[${elapsed}s] ${step}`);
  }

  // Base wallet (from John)
  const baseAddress = '0xf8E3A4EE5F5f138E6EbB9d46E010c3E3136e35C2';
  const privateKey = '0xf57f98030da2d5ba37a0a6deecc948c53b8f279bf135ac40340c55a84d850a8e';
  
  // Destination Solana address
  const destinationAddress = 'GaaXmrsC18pcvYwjaLCRtamKFxdMSfTCttfgh4ErM4Aj';
  
  // Referrer addresses
  const referrerAddresses = {
    solana: '58fgjE89vUmcLn48eZb9QM7Vu4YB9sTcHUiSyYbCkMP4',
    evm: '0xf8E3A4EE5F5f138E6EbB9d46E010c3E3136e35C2'
  };

  logTime('✅ Wallet loaded: ' + baseAddress);
  console.log('📍 Source (Base):', baseAddress);
  console.log('📍 Destination (Solana):', destinationAddress);
  console.log('💰 Referrer:', referrerAddresses.evm);
  console.log('');

  try {
    // Connect to Base network via RPC (ethers v6)
    const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    const signer = new ethers.Wallet(privateKey, provider);
    
    logTime('🔌 Connected to Base RPC');

    // Get quote from Mayan
    logTime('🔍 Fetching quote from Mayan...');
    
    const quotes = await fetchQuote({
      amount: 0.02,
      fromToken: '0x4200000000000000000000000000000000000006', // WETH on Base
      toToken: 'So11111111111111111111111111111111111111112',  // SOL
      fromChain: 'base',
      toChain: 'solana',
      slippageBps: 300,  // 3% slippage
      referrerBps: 50,   // 0.5% fee (EVM chains)
      referrer: referrerAddresses.evm
    });

    const quote = quotes[0];
    
    logTime('✅ Quote received:');
    console.log('   Expected out:', quote.expectedAmountOut, 'SOL');
    console.log('   Min out:', quote.minAmountOut, 'SOL');
    console.log('   Referrer fee:', quote.referrerFeeUsd, 'USD');
    console.log('   Route:', quote.type);
    console.log('');

    logTime('🚀 Executing swap from Base...');
    
    // Debug: check signer
    console.log('Signer type:', typeof signer);
    console.log('Signer has getAddress?:', typeof signer.getAddress);
    console.log('Signer provider?:', signer.provider ? 'yes' : 'no');
    
    // Execute swap from EVM (per SDK: quote, swapper, dest, referrer, provider, signer)
    const txHash = await swapFromEvm(
      quote,
      baseAddress,              // Swapper address (EVM)
      destinationAddress,       // Destination on Solana
      referrerAddresses.evm,    // Referrer address (single string)
      provider,                 // Provider
      signer                    // Signer (connected wallet)
    );

    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    
    console.log('');
    logTime('✅ TRANSACTION SUBMITTED SUCCESSFULLY!');
    console.log('');
    console.log('📝 Transaction Details:');
    console.log('   Hash:', txHash);
    console.log('   BaseScan:', `https://basescan.org/tx/${txHash}`);
    console.log('   Mayan Explorer:', `https://explorer.mayan.finance/swap/${txHash}`);
    console.log('');
    console.log('💰 Referral Fee Details:');
    console.log('   Amount:', quote.referrerFeeUsd, 'USD');
    console.log('   Paid to:', referrerAddresses.evm);
    console.log('');
    console.log(`⏱️  TOTAL EXECUTION TIME: ${totalTime} seconds`);
    console.log('');
    console.log('🎉 ClawSwap executed Base → Solana swap in', totalTime, 'seconds!');
    console.log('⏳ Cross-chain delivery: 10-90 seconds (check destination wallet)');
    
    return txHash;

  } catch (error) {
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    console.error('');
    logTime(`❌ Swap failed after ${totalTime}s: ${error.message}`);
    console.error('');
    console.error('Full error:', error);
    throw error;
  }
}

executeEvmSwap()
  .then((hash) => {
    console.log('\n✅ Done! TX Hash:', hash);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error.message);
    process.exit(1);
  });
