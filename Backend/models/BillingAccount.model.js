const mongoose = require('mongoose');

const billingAccountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BillingPlan',
      default: null,
    },
    // --- Pay-per-use ---
    credits_remaining: {
      type: Number,
      default: 0, // lượt gọi còn lại
    },
    credits_purchased: {
      type: Number,
      default: 0, // tổng lượt đã mua
    },
    // --- Subscription ---
    subscription_start: {
      type: Date,
      default: null,
    },
    subscription_end: {
      type: Date,
      default: null,
    },
    calls_used_this_period: {
      type: Number,
      default: 0, // lượt gọi đã dùng trong kỳ hiện tại
    },
    // --- Common ---
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
billingAccountSchema.index({ subscription_end: 1 });

const BillingAccount = mongoose.model('BillingAccount', billingAccountSchema);

module.exports = BillingAccount;
