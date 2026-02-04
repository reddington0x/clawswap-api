require('dotenv').config();
const { ethers } = require('ethers');
const { fetchQuote, swapFromEvm, addresses } = require('@mayanfinance/swap-sdk');

async function executeEvmSwapFixed() {
  console.log('🦞 ClawSwap - Base → Solana (FIXED)\n');
  const startTime = Date.now();
  
  function logTime(step) {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    console.log(`[${elapsed}s] ${step}`);
  }

  const baseAddress = '0xf8E3A4EE5F5f138E6EbB9d46E010c3E3136e35C2';
  const privateKey = '0xf57f98030da2d5ba37a0a6deecc948c53b8f279bf135ac40340c55a84d850a8e';
  const destinationAddress = 'GaaXmrsC18pcvYwjaLCRtamKFxdMSfTCttfgh4ErM4Aj';
  
  // CRITICAL: Referrer must be Solana address (Mayan auction happens on Solana)
  const referrerSolana = '58fgjE89vUmcLn48eZb9QM7Vu4YB9sTcHUiSyYbCkMP4';
  const referrerEvm = '0xf8E3A4EE5F5f138E6EbB9d46E010c3E3136e35C2';

  logTime('✅ Wallet loaded: ' + baseAddress);
  console.log('📍 Destination (Solana):', destinationAddress);
  console.log('💰 Referrer (Solana):', referrerSolana);
  console.log('');

  try {
    // Connect to Base
    const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    const signer = new ethers.Wallet(privateKey, provider);
    
    logTime('🔌 Connected to Base RPC');

    // Get quote (CRITICAL: use amountIn64 as string in smallest unit + Solana referrer)
    logTime('🔍 Fetching quote from Mayan...');
    
    const quotes = await fetchQuote({
      amountIn64: "20000000000000000", // 0.02 WETH in wei (18 decimals)
      fromToken: '0x4200000000000000000000000000000000000006', // WETH on Base
      toToken: 'So11111111111111111111111111111111111111112', // SOL
      fromChain: 'base',
      toChain: 'solana',
      slippageBps: 300,
      referrerBps: 50,
      referrer: referrerSolana  // MUST be Solana address (auction happens on Solana)
    });

    const quote = quotes[0];
    
    logTime('✅ Quote received:');
    console.log('   Expected out:', quote.expectedAmountOut, 'SOL');
    console.log('   Min out:', quote.minAmountOut, 'SOL');
    console.log('   Referrer fee: $' + quote.referrerFeeUsd);
    console.log('');

    // CRITICAL: First wrap ETH → WETH, then approve
    const wethAddress = '0x4200000000000000000000000000000000000006';
    const forwarderAddress = addresses.MAYAN_FORWARDER_CONTRACT;
    
    logTime('💱 Wrapping ETH → WETH...');
    
    const wethAbi = [
      'function deposit() payable',
      'function approve(address spender, uint256 amount) returns (bool)',
      'function allowance(address owner, address spender) view returns (uint256)',
      'function balanceOf(address account) view returns (uint256)'
    ];
    const wethContract = new ethers.Contract(wethAddress, wethAbi, signer);
    
    const amountWei = ethers.parseEther('0.02');
    
    // Check WETH balance first
    const wethBalance = await wethContract.balanceOf(baseAddress);
    
    if (wethBalance < amountWei) {
      logTime('💱 Depositing ETH to wrap into WETH...');
      const depositTx = await wethContract.deposit({ value: amountWei });
      logTime('⏳ Waiting for wrap confirmation...');
      await depositTx.wait();
      logTime('✅ ETH wrapped to WETH!');
    } else {
      logTime('✅ Already have enough WETH!');
    }
    
    logTime('🔓 Checking WETH approval...');
    const currentAllowance = await wethContract.allowance(baseAddress, forwarderAddress);
    
    if (currentAllowance < amountWei) {
      logTime('🔓 Approving WETH for Mayan Forwarder...');
      const approveTx = await wethContract.approve(forwarderAddress, amountWei);
      logTime('⏳ Waiting for approval confirmation...');
      await approveTx.wait();
      logTime('✅ WETH approved!');
    } else {
      logTime('✅ WETH already approved!');
    }

    // Now execute the swap (CORRECT signature: quote, swapper, dest, referrerAddresses, signer)
    logTime('🚀 Executing swap from Base...');
    
    const referrerAddresses = {
      solana: referrerSolana,
      evm: referrerEvm
    };
    
    const txHash = await swapFromEvm(
      quote,              // quote object
      baseAddress,        // swapper address
      destinationAddress, // destination on Solana
      referrerAddresses,  // referrer addresses object (not string!)
      signer              // signer (already has provider)
      // no provider parameter - signer already has it!
    );

    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    
    console.log('');
    logTime('✅ SWAP TRANSACTION SUBMITTED!');
    console.log('');
    console.log('📝 Transaction Hash:', txHash);
    console.log('   BaseScan:', `https://basescan.org/tx/${txHash}`);
    console.log('   Mayan Explorer:', `https://explorer.mayan.finance/swap/${txHash}`);
    console.log('');
    console.log(`⏱️  TOTAL TIME: ${totalTime} seconds`);
    console.log('');
    console.log('🎉 Base → Solana swap executing!');
    console.log('⏳ Cross-chain delivery: 10-90 seconds');
    console.log('');
    console.log('💰 Referrer fee: $' + quote.referrerFeeUsd + ' → ' + referrerSolana);
    
    return txHash;

  } catch (error) {
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    console.error('');
    logTime(`❌ Failed after ${totalTime}s`);
    console.error('Error:', error.message);
    if (error.stack) console.error('Stack:', error.stack);
    throw error;
  }
}

executeEvmSwapFixed()
  .then((hash) => {
    console.log('\n✅ SUCCESS! Hash:', hash);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 FAILED');
    process.exit(1);
  });
