require('dotenv').config();
const { Keypair, Connection } = require('@solana/web3.js');
const { fetchQuote, swapFromSolana } = require('@mayanfinance/swap-sdk');
const bs58 = require('bs58').default;

async function executeSwap() {
  console.log('🦞 ClawSwap - Autonomous Agent Swap Execution\n');

  // Wallet from John (test wallet)
  const privateKeyString = '4HcRABUzpaibA16RUUqNrhb82o5mgAfT6Xd5sMTVPPdM1VCAbkYgSLrAygt72RNHuMnH8NcnYXmJfuXKnT68RM5p';
  const privateKeyBytes = bs58.decode(privateKeyString);
  const wallet = Keypair.fromSecretKey(privateKeyBytes);
  
  console.log('✅ Wallet loaded:', wallet.publicKey.toBase58());
  
  // Destination on Base
  const destinationAddress = '0xa68495554492756B3110AAEE898BAf013ae49978';
  
  // Your referrer addresses (where fees go)
  const referrerAddresses = {
    solana: '58fgjE89vUmcLn48eZb9QM7Vu4YB9sTcHUiSyYbCkMP4',
    evm: '0xf8E3A4EE5F5f138E6EbB9d46E010c3E3136e35C2',
    sui: '0x1e6c5d829ce9e5b8b65f103907ecf107ae868d703d5de9aea996f9823ac11557'
  };

  console.log('📍 Source wallet:', wallet.publicKey.toBase58());
  console.log('📍 Destination (Base):', destinationAddress);
  console.log('💰 Referrer (fees):', referrerAddresses.solana);
  console.log('\n🔍 Fetching quote from Mayan...\n');

  try {
    // Get quote from Mayan (CORRECT FORMAT per SDK docs)
    const quotes = await fetchQuote({
      amount: 0.05,  // 0.05 SOL
      fromToken: 'So11111111111111111111111111111111111111112', // SOL
      toToken: '0x4200000000000000000000000000000000000006', // WETH on Base
      fromChain: 'solana',
      toChain: 'base',
      slippageBps: 500,  // 5% slippage (higher for small amounts)
      referrerBps: 100,  // 1% fee
      referrer: referrerAddresses.solana
    });

    const quote = quotes[0];  // Use first (best) quote
    
    console.log('✅ Quote received:');
    console.log('   Expected out:', quote.expectedAmountOut, 'WETH');
    console.log('   Min out:', quote.minAmountOut, 'WETH');
    console.log('   Referrer fee:', quote.referrerFeeUsd, 'USD');
    console.log('   Route:', quote.type);
    console.log('   Slippage:', quote.slippageBps, 'bps');
    console.log('\n🚀 Executing swap...\n');

    // Execute swap from Solana (CORRECT FORMAT per SDK docs)
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    
    // Signing function (REQUIRED by SDK)
    const signTransaction = async (tx) => {
      tx.sign([wallet]);
      return tx;
    };

    const signature = await swapFromSolana(
      quote,                            // The quote object
      wallet.publicKey.toBase58(),      // Source wallet address (string)
      destinationAddress,               // Destination address on target chain
      referrerAddresses,                // Referrer addresses object {solana, evm, sui}
      signTransaction,                  // Signing function
      connection                        // Solana connection
    );

    console.log('✅ SWAP EXECUTED SUCCESSFULLY!');
    console.log('\n📝 Transaction Details:');
    console.log('   Signature:', signature);
    console.log('   Track on Mayan:', `https://explorer.mayan.finance/swap/${signature}`);
    console.log('   Track on Solscan:', `https://solscan.io/tx/${signature}`);
    console.log('\n💰 Referral Fee Details:');
    console.log('   Amount:', quote.referrerFeeUsd, 'USD (~$0.047)');
    console.log('   Paid to:', referrerAddresses.solana);
    console.log('\n🎉 ClawSwap working perfectly! Deploy and disappear = COMPLETE!');
    
    return signature;

  } catch (error) {
    console.error('❌ Swap failed:', error.message);
    
    // Better error messages
    if (error.message.includes('0x1788')) {
      console.error('\n💡 This is a Jupiter slippage error.');
      console.error('   Solutions:');
      console.error('   1. Increase slippageBps (currently 500)');
      console.error('   2. Try larger amount (0.1+ SOL)');
      console.error('   3. Wait a few seconds and retry');
    } else if (error.message.includes('insufficient')) {
      console.error('\n💡 Insufficient balance.');
      console.error('   Make sure wallet has enough SOL for:');
      console.error('   - Swap amount (0.05 SOL)');
      console.error('   - Gas fees (~0.01 SOL)');
    } else {
      console.error('\nFull error:', error);
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
