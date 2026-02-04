require('dotenv').config();
const { Keypair, Connection } = require('@solana/web3.js');
const { fetchQuote, swapFromSolana } = require('@mayanfinance/swap-sdk');
const bs58 = require('bs58').default;

async function executeSwap() {
  console.log('🦞 ClawSwap - OPTIMIZED Autonomous Swap\n');
  const startTime = Date.now();
  
  function logTime(step) {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    console.log(`[${elapsed}s] ${step}`);
  }

  // Wallet from John (test wallet)
  const privateKeyString = '4HcRABUzpaibA16RUUqNrhb82o5mgAfT6Xd5sMTVPPdM1VCAbkYgSLrAygt72RNHuMnH8NcnYXmJfuXKnT68RM5p';
  const privateKeyBytes = bs58.decode(privateKeyString);
  const wallet = Keypair.fromSecretKey(privateKeyBytes);
  
  logTime(`✅ Wallet loaded: ${wallet.publicKey.toBase58()}`);
  
  // Destination on Base
  const destinationAddress = '0xa68495554492756B3110AAEE898BAf013ae49978';
  
  // Your referrer addresses (where fees go)
  const referrerAddresses = {
    solana: process.env.REFERRER_SOLANA || '58fgjE89vUmcLn48eZb9QM7Vu4YB9sTcHUiSyYbCkMP4',
    evm: process.env.REFERRER_EVM || '0xf8E3A4EE5F5f138E6EbB9d46E010c3E3136e35C2',
    sui: process.env.REFERRER_SUI || '0x1e6c5d829ce9e5b8b65f103907ecf107ae868d703d5de9aea996f9823ac11557'
  };

  console.log('📍 Source wallet:', wallet.publicKey.toBase58());
  console.log('📍 Destination (Base):', destinationAddress);
  console.log('💰 Referrer (fees):', referrerAddresses.solana);
  console.log('');

  try {
    // SPEED OPTIMIZATION 1: Use faster RPC with optimized commitment
    const rpcUrl = process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(rpcUrl, {
      commitment: 'confirmed',      // Don't wait for finalized (saves 2-5s)
      confirmTransactionInitialTimeout: 60000
    });
    
    logTime('🔌 Connected to RPC: ' + rpcUrl);

    // SPEED OPTIMIZATION 2: Lower slippage = faster auction (300 bps = 3%)
    logTime('🔍 Fetching quote from Mayan...');
    
    const quotes = await fetchQuote({
      amount: 0.05,  // 0.05 SOL
      fromToken: 'So11111111111111111111111111111111111111112', // SOL
      toToken: '0x4200000000000000000000000000000000000006', // WETH on Base
      fromChain: 'solana',
      toChain: 'base',
      slippageBps: 300,  // 3% (was 500) - faster auction
      referrerBps: 100,  // 1% fee
      referrer: referrerAddresses.solana
    });

    const quote = quotes[0];  // Use first (best) quote
    
    logTime(`✅ Quote received:`);
    console.log('   Expected out:', quote.expectedAmountOut, 'WETH');
    console.log('   Min out:', quote.minAmountOut, 'WETH');
    console.log('   Referrer fee:', quote.referrerFeeUsd, 'USD');
    console.log('   Route:', quote.type);
    console.log('   Slippage:', quote.slippageBps, 'bps');
    console.log('');

    // SPEED OPTIMIZATION 3: Fast signing function (minimal overhead)
    logTime('🚀 Building and signing transaction...');
    
    const signTransaction = async (tx) => {
      tx.sign([wallet]);
      return tx;
    };

    // SPEED OPTIMIZATION 4: Execute with optimized send options
    const signature = await swapFromSolana(
      quote,
      wallet.publicKey.toBase58(),      // Source wallet address (string)
      destinationAddress,               // Destination address on target chain
      referrerAddresses,                // Referrer addresses object
      signTransaction,                  // Signing function
      connection,                       // Solana connection
      undefined,                        // extraRpcs (can add parallel RPCs)
      {
        skipPreflight: false,           // Keep preflight for safety
        preflightCommitment: 'confirmed', // Faster than finalized
        maxRetries: 2                   // Reduce retries (was 3)
      }
    );

    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    
    console.log('');
    logTime('✅ TRANSACTION SUBMITTED SUCCESSFULLY!');
    console.log('');
    console.log('📝 Transaction Details:');
    console.log('   Signature:', signature);
    console.log('   Solscan:', `https://solscan.io/tx/${signature}`);
    console.log('   Mayan Explorer:', `https://explorer.mayan.finance/swap/${signature}`);
    console.log('');
    console.log('💰 Referral Fee Details:');
    console.log('   Amount:', quote.referrerFeeUsd, 'USD');
    console.log('   Paid to:', referrerAddresses.solana);
    console.log('');
    console.log(`⏱️  TOTAL EXECUTION TIME: ${totalTime} seconds`);
    console.log('');
    console.log('🎉 ClawSwap executed swap in', totalTime, 'seconds!');
    console.log('⏳ Cross-chain delivery: 10-90 seconds (check Mayan Explorer)');
    
    return signature;

  } catch (error) {
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    console.error('');
    logTime(`❌ Swap failed after ${totalTime}s: ${error.message}`);
    console.error('');
    
    // Better error messages
    if (error.message.includes('0x1788')) {
      console.error('💡 Jupiter slippage error - price moved too much');
      console.error('   Solutions:');
      console.error('   1. Increase slippage (currently 300 bps)');
      console.error('   2. Try larger amount (0.1+ SOL)');
      console.error('   3. Wait a few seconds and retry');
    } else if (error.message.includes('insufficient')) {
      console.error('💡 Insufficient balance');
      console.error('   Make sure wallet has:');
      console.error('   - Swap amount (0.05 SOL)');
      console.error('   - Gas fees (~0.01 SOL)');
    } else if (error.message.includes('simulation failed')) {
      console.error('💡 Transaction simulation failed');
      console.error('   This usually means price moved or network congestion');
      console.error('   Get fresh quote and retry');
    } else {
      console.error('Full error:', error);
    }
    
    throw error;
  }
}

// Run it
executeSwap()
  .then((sig) => {
    console.log('\n✅ Done! Signature:', sig);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error.message);
    process.exit(1);
  });
