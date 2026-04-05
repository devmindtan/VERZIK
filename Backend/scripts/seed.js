/**
 * Seed Script
 * - Tạo superuser mặc định nếu chưa tồn tại
 * - Tạo billing plans mặc định
 */

const { ethers } = require('ethers');
const crypto = require('crypto');
const User = require('../models/User.model');
const Identity = require('../models/Identity.model');
const Wallet = require('../models/Wallet.model');
const BillingPlan = require('../models/BillingPlan.model');

/**
 * Encrypt private key bằng AES-256-CBC
 */
const encryptPrivateKey = (privateKey) => {
  const encryptionKey = process.env.WALLET_ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('WALLET_ENCRYPTION_KEY is not configured');
  }

  const iv = crypto.randomBytes(16);
  const key = Buffer.from(encryptionKey, 'hex');
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
};

/**
 * Seed superuser
 */
const seedSuperuser = async () => {
  const walletAddress = process.env.SUPERUSER_WALLET_ADDRESS;

  // Kiểm tra đã có superuser chưa
  const existingSuperuser = await User.findOne({ is_superuser: true });
  if (existingSuperuser) {
    console.log('  ⏭️  Superuser already exists, skipping');
    return;
  }

  // Tạo superuser
  const superuser = await User.create({
    display_name: 'System Admin',
    is_superuser: true,
    is_staff: true,
    is_active: true,
  });

  // Nếu có wallet address → tạo identity + wallet
  if (walletAddress) {
    await Identity.create({
      user: superuser._id,
      provider: 'wallet',
      provider_id: walletAddress.toLowerCase(),
      is_primary: true,
    });

    // Tạo wallet cho superuser (generate mới nếu cần)
    const wallet = ethers.Wallet.createRandom();
    const encryptedKey = encryptPrivateKey(wallet.privateKey);

    await Wallet.create({
      user: superuser._id,
      address: walletAddress.toLowerCase(),
      encrypted_private_key: encryptedKey,
      is_system_generated: true,
    });

    console.log(`  ✅ Superuser created with wallet: ${walletAddress}`);
  } else {
    console.log('  ✅ Superuser created (no wallet address configured)');
    console.log('  ⚠️  Set SUPERUSER_WALLET_ADDRESS in .env to link a wallet');
  }
};

/**
 * Seed default billing plans
 */
const seedBillingPlans = async () => {
  const existingPlans = await BillingPlan.countDocuments();
  if (existingPlans > 0) {
    console.log(`  ⏭️  Billing plans already exist (${existingPlans}), skipping`);
    return;
  }

  const defaultPlans = [
    {
      name: 'Pay Per Use - Basic',
      type: 'pay_per_use',
      price_per_call: 1000, // 1,000 VND per call
      min_purchase: 10,
      features: ['verify_document', 'view_history'],
    },
    {
      name: 'Pay Per Use - Pro',
      type: 'pay_per_use',
      price_per_call: 800, // discount
      min_purchase: 100,
      features: ['verify_document', 'view_history', 'priority_support'],
    },
    {
      name: 'Monthly Starter',
      type: 'subscription',
      price_per_period: 500000, // 500,000 VND/month
      period_type: 'monthly',
      calls_included: 500,
      overage_price: 1200,
      features: ['verify_document', 'view_history', 'push_verification'],
    },
    {
      name: 'Monthly Pro',
      type: 'subscription',
      price_per_period: 2000000, // 2,000,000 VND/month
      period_type: 'monthly',
      calls_included: 5000,
      overage_price: 500,
      features: ['verify_document', 'view_history', 'push_verification', 'priority_support', 'api_access'],
    },
    {
      name: 'Yearly Enterprise',
      type: 'subscription',
      price_per_period: 20000000, // 20,000,000 VND/year
      period_type: 'yearly',
      calls_included: -1, // unlimited
      overage_price: 0,
      features: ['verify_document', 'view_history', 'push_verification', 'priority_support', 'api_access', 'dedicated_support'],
    },
  ];

  await BillingPlan.insertMany(defaultPlans);
  console.log(`  ✅ Created ${defaultPlans.length} default billing plans`);
};

module.exports = {
  seedSuperuser,
  seedBillingPlans,
};
