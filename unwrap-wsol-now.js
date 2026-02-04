// Unwrap WSOL → native SOL for user's wallet
require('dotenv').config();
const { Connection, PublicKey, Transaction } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID, createCloseAccountInstruction, getAssociatedTokenAddress } = require('@solana/spl-token');

async function unwrapWsolForUser() {
  console.log('🦞 ClawSwap - Unwrap WSOL → Native SOL\n');
  
  const userWallet = 'GaaXmrsC18pcvYwjaLCRtamKFxdMSfTCttfgh4ErM4Aj';
  const heliusKey = process.env.HELIUS_API_KEY || 'b1b732ee-dc03-484c-ab78-7278586d12c7';
  const rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`;
  
  console.log('📍 User wallet:', userWallet);
  console.log('🔌 Connecting to Helius RPC...\n');
  
  const connection = new Connection(rpcUrl, 'confirmed');
  
  // WSOL mint address
  const WSOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');
  const userPubkey = new PublicKey(userWallet);
  
  // Get WSOL token account
  const wsolAccount = await getAssociatedTokenAddress(
    WSOL_MINT,
    userPubkey
  );
  
  console.log('🔍 WSOL Token Account:', wsolAccount.toBase58());
  
  // Check account info
  const accountInfo = await connection.getAccountInfo(wsolAccount);
  
  if (!accountInfo) {
    console.log('❌ No WSOL token account found');
    console.log('   User may have already unwrapped or never received WSOL');
    return;
  }
  
  // Parse token account data
  const tokenAmount = await connection.getTokenAccountBalance(wsolAccount);
  
  console.log('\n📊 WSOL Balance:');
  console.log('   Amount:', tokenAmount.value.uiAmount, 'WSOL');
  console.log('   Value:', `~$${(tokenAmount.value.uiAmount * 100).toFixed(2)}`); // Rough estimate
  
  console.log('\n⚠️  TO UNWRAP:');
  console.log('User needs to sign a transaction to close the WSOL account.');
  console.log('This will automatically convert WSOL → native SOL.');
  console.log('\nTransaction would be:');
  console.log('  - Close WSOL token account');
  console.log('  - Rent + WSOL balance → native SOL in wallet');
  console.log('  - Gas cost: ~0.000005 SOL');
  
  console.log('\n💡 How to unwrap in Phantom:');
  console.log('1. Open Phantom wallet');
  console.log('2. Find "Wrapped SOL" token');
  console.log('3. Click "Unwrap" or "Convert to SOL"');
  console.log('4. Confirm transaction');
  console.log('\nOR use Solana CLI:');
  console.log(`spl-token close ${wsolAccount.toBase58()} --owner ${userWallet}`);
}

unwrapWsolForUser()
  .then(() => {
    console.log('\n✅ Analysis complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
