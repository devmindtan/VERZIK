const mongoose = require('mongoose');

const billingPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['pay_per_use', 'subscription'],
      required: true,
    },
    // --- Pay-per-use fields ---
    price_per_call: {
      type: Number,
      default: 0, // giá mỗi lượt gọi API
    },
    min_purchase: {
      type: Number,
      default: 1, // mua tối thiểu bao nhiêu lượt
    },
    // --- Subscription fields ---
    price_per_period: {
      type: Number,
      default: 0, // giá thuê theo kỳ
    },
    period_type: {
      type: String,
      enum: ['monthly', 'yearly', null],
      default: null,
    },
    calls_included: {
      type: Number,
      default: 0, // số lượt gọi trong gói (-1 = unlimited)
    },
    overage_price: {
      type: Number,
      default: 0, // giá mỗi lượt vượt gói
    },
    // --- Common ---
    features: {
      type: [String],
      default: [],
    },
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
billingPlanSchema.index({ type: 1, is_active: 1 });

const BillingPlan = mongoose.model('BillingPlan', billingPlanSchema);

module.exports = BillingPlan;
