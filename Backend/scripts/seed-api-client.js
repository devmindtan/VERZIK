/**
 * Seed API Client cho test upload
 *
 * Chạy: node scripts/seed-api-client.js
 * Tạo 1 ApiClient với:
 *   - client_id + client_secret (hiện ra console)
 *   - permissions: ['upload']
 *   - whitelisted_domains: domain được phép gọi upload API
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const ApiClient = require('../models/ApiClient.model');
const User = require('../models/User.model');

const TEST_DOMAINS = [
  'localhost',
  '127.0.0.1',
];

const run = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI not configured');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('✅ MongoDB connected');

  // Tìm superuser để gắn làm owner
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

  // Check nếu đã có API client cho test
  const existing = await ApiClient.findOne({ name: 'Test Upload Client' });
  if (existing) {
    console.log('\n⏭️  API client "Test Upload Client" already exists:');
    console.log(`   client_id: ${existing.client_id}`);
    console.log(`   whitelisted_domains: ${(existing.whitelisted_domains || []).join(', ')}`);
    console.log('   ⚠️  Nếu muốn tạo lại, xóa record cũ trong MongoDB trước.');
    await mongoose.disconnect();
    return;
  }

  // Generate credentials
  const clientId = `vz_${crypto.randomBytes(16).toString('hex')}`;
  const clientSecret = crypto.randomBytes(32).toString('hex');
  const secretHash = await bcrypt.hash(clientSecret, 10);

  const apiClient = await ApiClient.create({
    user: owner._id,
    client_id: clientId,
    client_secret_hash: secretHash,
    name: 'Test Upload Client',
    is_active: true,
    permissions: ['upload'],
    whitelisted_domains: TEST_DOMAINS,
  });

  console.log('\n✅ API Client created successfully!');
  console.log('══════════════════════════════════════════');
  console.log(`   client_id:     ${clientId}`);
  console.log(`   client_secret: ${clientSecret}`);
  console.log(`   permissions:   ${apiClient.permissions.join(', ')}`);
  console.log(`   domains:       ${TEST_DOMAINS.join(', ')}`);
  console.log('══════════════════════════════════════════');
  console.log('\n⚠️  LƯU LẠI client_secret — không thể xem lại sau khi seed!');

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
