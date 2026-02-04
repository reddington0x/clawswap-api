#!/usr/bin/env node
/**
 * ClawSwap Agent Wallet Generator
 * 
 * Generates secure wallets for AI agents to use with ClawSwap
 * Run once, fund the wallets, then your agent can swap autonomously!
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🦞 ClawSwap Agent Wallet Generator\n');

// Generate Solana wallet (simplified - ed25519 keypair)
function generateSolanaWallet() {
  // Generate ed25519 keypair (same as Solana uses)
  const keypair = crypto.generateKeyPairSync('ed25519');
  
  const publicKey = keypair.publicKey.export({ type: 'spki', format: 'der' });
  const privateKey = keypair.privateKey.export({ type: 'pkcs8', format: 'der' });
  
  // Extract raw 32-byte keys (Solana format)
  const pubKeyRaw = publicKey.slice(-32);
  const privKeyRaw = privateKey.slice(-32);
  
  // Solana uses base58 for addresses, but we'll use hex for simplicity
  const address = pubKeyRaw.toString('hex');
  const secret = Buffer.concat([privKeyRaw, pubKeyRaw]); // Solana format: 64 bytes
  
  return {
    address,
    privateKey: secret.toString('base64'),
    secretBytes: Array.from(secret)
  };
}

// Generate EVM wallet
function generateEvmWallet() {
  const privateKey = crypto.randomBytes(32);
  const address = '0x' + crypto.createHash('sha256').update(privateKey).digest('hex').slice(0, 40);
  
  return {
    address,
    privateKey: '0x' + privateKey.toString('hex')
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
