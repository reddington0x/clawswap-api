// Unwrap WSOL → native SOL or WETH → native ETH after swap
const { Connection, Keypair, Transaction, SystemProgram } = require('@solana/web3.js');
const { ethers } = require('ethers');
const { TOKEN_PROGRAM_ID, createCloseAccountInstruction, getAssociatedTokenAddress } = require('@solana/spl-token');

/**
 * Unwrap WSOL to native SOL
 * @param {Keypair} wallet - Solana wallet
 * @param {Connection} connection - Solana RPC connection
 * @returns {string} Transaction signature
 */
async function unwrapSol(wallet, connection) {
  console.log('🔓 Unwrapping WSOL → native SOL...');
  
  const WSOL_MINT = 'So11111111111111111111111111111111111111112';
  
  // Get WSOL token account
  const wsolAccount = await getAssociatedTokenAddress(
    new PublicKey(WSOL_MINT),
    wallet.publicKey
  );
  
  // Check if account exists and has balance
  const accountInfo = await connection.getAccountInfo(wsolAccount);
  if (!accountInfo) {
    console.log('✅ No WSOL account found (already native SOL)');
    return null;
  }
  
  // Close the WSOL account (automatically unwraps to native SOL)
  const transaction = new Transaction().add(
    createCloseAccountInstruction(
      wsolAccount,           // Token account to close
      wallet.publicKey,      // Destination for remaining SOL
      wallet.publicKey,      // Owner
      [],                    // Multisig
      TOKEN_PROGRAM_ID
    )
  );
  
  const signature = await connection.sendTransaction(transaction, [wallet]);
  await connection.confirmTransaction(signature);
  
  console.log('✅ WSOL unwrapped to native SOL!');
  console.log('   Signature:', signature);
  
  return signature;
}

/**
 * Unwrap WETH to native ETH
 * @param {ethers.Wallet} wallet - EVM wallet/signer
 * @param {string} wethAddress - WETH contract address
 * @returns {string} Transaction hash
 */
async function unwrapEth(wallet, wethAddress) {
  console.log('🔓 Unwrapping WETH → native ETH...');
  
  const wethAbi = [
    'function balanceOf(address account) view returns (uint256)',
    'function withdraw(uint256 amount)'
  ];
  
  const wethContract = new ethers.Contract(wethAddress, wethAbi, wallet);
  
  // Check WETH balance
  const balance = await wethContract.balanceOf(wallet.address);
  
  if (balance === 0n) {
    console.log('✅ No WETH balance (already native ETH)');
    return null;
  }
  
  console.log(`   Unwrapping ${ethers.formatEther(balance)} WETH...`);
  
  // Withdraw WETH → ETH
  const tx = await wethContract.withdraw(balance);
  const receipt = await tx.wait();
  
  console.log('✅ WETH unwrapped to native ETH!');
  console.log('   Transaction:', receipt.hash);
  
  return receipt.hash;
}

/**
 * Auto-detect and unwrap wrapped native tokens
 * @param {object} options - { chain, wallet, connection/provider, tokenAddress }
 */
async function autoUnwrap({ chain, wallet, connection, tokenAddress }) {
  // Native token addresses that should be unwrapped
  const NATIVE_TOKENS = {
    solana: 'So11111111111111111111111111111111111111112', // SOL
    ethereum: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
    base: '0x4200000000000000000000000000000000000006', // WETH on Base
    arbitrum: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH on Arbitrum
    optimism: '0x4200000000000000000000000000000000000006', // WETH on Optimism
    polygon: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', // WETH on Polygon
    avalanche: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', // WAVAX
    bsc: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' // WBNB
  };
  
  const nativeTokenAddress = NATIVE_TOKENS[chain.toLowerCase()];
  
  // Check if this token should be unwrapped
  if (!nativeTokenAddress || tokenAddress.toLowerCase() !== nativeTokenAddress.toLowerCase()) {
    console.log('ℹ️  Not a wrapped native token, no unwrap needed');
    return null;
  }
  
  // Unwrap based on chain type
  if (chain === 'solana') {
    return await unwrapSol(wallet, connection);
  } else {
    // EVM chain
    return await unwrapEth(wallet, nativeTokenAddress);
  }
}

module.exports = {
  unwrapSol,
  unwrapEth,
  autoUnwrap
};
