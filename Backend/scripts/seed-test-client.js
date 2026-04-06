/**
 * Seed API Client cụ thể cho test upload (sign-ui)
 *
 * Chạy: node scripts/seed-test-client.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const ApiClient = require('../models/ApiClient.model');
const User = require('../models/User.model');

const TARGET_CLIENT_ID = 'vz_c7bf29db842ada690d9a539b96344914';
const TARGET_CLIENT_SECRET = 'test_secret_123'; // Không quan trọng lắm cho test local
const TEST_DOMAINS = ['localhost', '127.0.0.1'];

const run = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI not configured');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('✅ MongoDB connected');

  let owner = await User.findOne({ is_superuser: true });
  if (!owner) {
    owner = await User.create({
      display_name: 'Test Owner',
      is_superuser: true,
      is_staff: true,
      is_active: true,
    });
    console.log('  ✅ Created test owner user');
  }

  const existing = await ApiClient.findOne({ client_id: TARGET_CLIENT_ID });
  if (existing) {
    console.log(`\n⏭️  API client "${TARGET_CLIENT_ID}" already exists.`);
    existing.permissions = ['upload'];
    existing.whitelisted_domains = TEST_DOMAINS;
    await existing.save();
    console.log('  ✅ Updated permissions and domains.');
  } else {
    const secretHash = await bcrypt.hash(TARGET_CLIENT_SECRET, 10);
    await ApiClient.create({
      user: owner._id,
      client_id: TARGET_CLIENT_ID,
      client_secret_hash: secretHash,
      name: 'Sign UI Test Client',
      is_active: true,
      permissions: ['upload'],
      whitelisted_domains: TEST_DOMAINS,
    });
    console.log(`\n✅ API Client "${TARGET_CLIENT_ID}" created successfully!`);
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
