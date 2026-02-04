#!/usr/bin/env node
/**
 * ClawSwap Agent Wallet Generator
 * 
 * Generates secure wallets for AI agents to use with ClawSwap
 * Run once, fund the wallets, then your agent can swap autonomously!
 * 
 * REQUIRES: npm install @solana/web3.js ethers
 */

const fs = require('fs');
const path = require('path');

console.log('🦞 ClawSwap Agent Wallet Generator\n');

// Check dependencies
let Keypair, Wallet;
try {
  ({ Keypair } = require('@solana/web3.js'));
  ({ Wallet } = require('ethers'));
} catch (e) {
  console.error('❌ Missing dependencies!\n');
  console.error('Please run: npm install @solana/web3.js ethers\n');
  process.exit(1);
}

// Generate REAL Solana wallet using @solana/web3.js
function generateSolanaWallet() {
  const keypair = Keypair.generate();
  
  return {
    address: keypair.publicKey.toBase58(),
    privateKey: Buffer.from(keypair.secretKey).toString('base64'),
    secretBytes: Array.from(keypair.secretKey)
  };
}

// Generate REAL EVM wallet using ethers
function generateEvmWallet() {
  const wallet = Wallet.createRandom();
  
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic.phrase
  };
}

// Main
try {
  console.log('⚙️  Generating wallets...\n');
  
  // Generate wallets
  const solana = generateSolanaWallet();
  const evm = generateEvmWallet();
  
  // Create .gitignore if doesn't exist
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  let gitignoreContent = '';
  
  if (fs.existsSync(gitignorePath)) {
    gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  }
  
  if (!gitignoreContent.includes('.wallet-')) {
    fs.appendFileSync(gitignorePath, '\n# Agent wallets (NEVER COMMIT!)\n.wallet-*.json\n.wallet-*.txt\n');
    console.log('✅ Added wallet files to .gitignore\n');
  }
  
  // Save wallets
  fs.writeFileSync('.wallet-solana.json', JSON.stringify({
    address: solana.address,
    privateKey: solana.privateKey,
    secretKey: solana.secretBytes,
    generated: new Date().toISOString(),
    warning: 'NEVER commit this file or share the private key!'
  }, null, 2));
  
  fs.writeFileSync('.wallet-evm.json', JSON.stringify({
    address: evm.address,
    privateKey: evm.privateKey,
    generated: new Date().toISOString(),
    warning: 'NEVER commit this file or share the private key!'
  }, null, 2));
  
  console.log('✅ Wallets generated successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🟣 SOLANA WALLET');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Address:', solana.address);
  console.log('Saved to: .wallet-solana.json\n');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔷 EVM WALLET (ETH, Base, Arbitrum, etc.)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Address:', evm.address);
  console.log('Saved to: .wallet-evm.json\n');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚠️  NEXT STEPS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. Fund these wallets from an exchange');
  console.log('   Solana: Need ~0.1+ SOL');
  console.log('   EVM: Need gas + swap amount (~$10+)');
  console.log('');
  console.log('2. Your AI agent can now load these wallets:');
  console.log('   const wallet = require("./.wallet-solana.json");');
  console.log('');
  console.log('3. Start swapping with ClawSwap!');
  console.log('   https://clawswap.tech/skill.md');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 SECURITY REMINDERS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('❌ NEVER commit .wallet-*.json to git');
  console.log('❌ NEVER share private keys');
  console.log('✅ Keep backups in secure location');
  console.log('✅ Start with small test amounts');
  console.log('');
  console.log('🦞 Happy swapping!');
  
} catch (error) {
  console.error('❌ Error generating wallets:', error.message);
  process.exit(1);
}
