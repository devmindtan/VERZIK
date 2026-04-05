/**
 * Database Migration Script
 * Chạy tự động khi container start.
 * - Import tất cả models → Mongoose tạo collections + indexes
 * - Seed superuser + default billing plans
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { seedSuperuser, seedBillingPlans } = require('./seed');

// Import tất cả models để Mongoose tạo collections
const User = require('../models/User.model');
const Identity = require('../models/Identity.model');
const Wallet = require('../models/Wallet.model');
const ViewLog = require('../models/ViewLog.model');
const ApiClient = require('../models/ApiClient.model');
const BillingPlan = require('../models/BillingPlan.model');
const BillingAccount = require('../models/BillingAccount.model');
const DocumentRecord = require('../models/DocumentRecord.model');
const UserConsent = require('../models/UserConsent.model');
const ActivityLog = require('../models/ActivityLog.model');
const EncryptedDocument = require('../models/EncryptedDocument.model');

const ALL_MODELS = [User, Identity, Wallet, ViewLog, ApiClient, BillingPlan, BillingAccount, DocumentRecord, UserConsent, ActivityLog, EncryptedDocument];

const runMigrations = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not configured');
    process.exit(1);
  }

  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected');

    // Ensure tất cả indexes được tạo
    console.log('\n📦 Ensuring collections & indexes...');
    for (const Model of ALL_MODELS) {
      const collectionName = Model.collection.collectionName;
      await Model.createIndexes();
      console.log(`  ✅ ${collectionName} — indexes synced`);
    }

    // Seed data
    console.log('\n🌱 Running seeds...');
    await seedSuperuser();
    await seedBillingPlans();

    console.log('\n🎉 Migrations completed successfully!\n');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

// Chạy trực tiếp: node scripts/migrate.js
runMigrations();
