require('dotenv').config();
const { Keypair, Connection } = require('@solana/web3.js');
const { fetchQuote, swapFromSolana } = require('@mayanfinance/swap-sdk');
const bs58 = require('bs58').default;

async function fastSwap() {
  console.log('🦞 ClawSwap - OPTIMIZED Fast Execution\n');
  const startTime = Date.now();

  // Wallet
  const privateKeyString = '4HcRABUzpaibA16RUUqNrhb82o5mgAfT6Xd5sMTVPPdM1VCAbkYgSLrAygt72RNHuMnH8NcnYXmJfuXKnT68RM5p';
  const privateKeyBytes = bs58.decode(privateKeyString);
  const wallet = Keypair.fromSecretKey(privateKeyBytes);
  
  const destinationAddress = '0xa68495554492756B3110AAEE898BAf013ae49978';
  const referrerAddresses = {
    solana: '58fgjE89vUmcLn48eZb9QM7Vu4YB9sTcHUiSyYbCkMP4',
    evm: '0xf8E3A4EE5F5f138E6EbB9d46E010c3E3136e35C2'
  };

  console.log('⏱️  Starting timer...\n');

  try {
    // OPTIMIZATION 1: Use faster RPC (Helius/Quicknode instead of public)
    const connection = new Connection(
      process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com',
      { commitment: 'confirmed' } // Don't wait for finalized
    );

    // OPTIMIZATION 2: Get quote with minimal slippage  
    console.log(`[${Math.floor((Date.now() - startTime) / 1000)}s] Fetching quote...`);
    const quotes = await fetchQuote({
      amount: 0.05,
      fromToken: 'So11111111111111111111111111111111111111112',
      toToken: '0x4200000000000000000000000000000000000006',
      fromChain: 'solana',
      toChain: 'base',
      slippageBps: 300, // Lower slippage = faster auction
      referrerBps: 100,
      referrer: referrerAddresses.solana
    });

    const quote = quotes[0];
    console.log(`[${Math.floor((Date.now() - startTime) / 1000)}s] ✅ Quote: ${quote.expectedAmountOut} WETH`);

    // OPTIMIZATION 3: Fast signing function (no async overhead)
    const signTransaction = (tx) => {
      tx.sign([wallet]);
      return Promise.resolve(tx);
    };

    // OPTIMIZATION 4: Execute with options for speed
    console.log(`[${Math.floor((Date.now() - startTime) / 1000)}s] Executing swap...`);
    
    const signature = await swapFromSolana(
      quote,
      wallet.publicKey.toBase58(),
      destinationAddress,
      referrerAddresses,
      signTransaction,
      connection,
      undefined, // extraRpcs - can add parallel RPCs here
      { 
        skipPreflight: false, // Keep preflight for safety
        maxRetries: 2 // Reduce retries
      }
    );

    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    
    console.log(`\n✅ SWAP COMPLETE IN ${totalTime} SECONDS!`);
    console.log('📝 Signature:', signature);
    console.log('🔍 Track:', `https://explorer.mayan.finance/swap/${signature}`);
    console.log(`💰 Referral fee: ~$${quote.referrerFeeUsd.toFixed(2)}`);
    
    return { signature, totalTime };

  } catch (error) {
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    console.error(`❌ Failed after ${totalTime}s:`, error.message);
    throw error;
  }
}

fastSwap()
  .then(({ signature, totalTime }) => {
    console.log(`\n🎉 SUCCESS: ${totalTime}s total execution time`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 FAILED:', error);
    process.exit(1);
  });
