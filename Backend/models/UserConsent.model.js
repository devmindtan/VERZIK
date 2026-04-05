const mongoose = require('mongoose');

const userConsentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    consent_type: {
      type: String,
      enum: ['view_document'],
      required: true,
    },
    wallet_address: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    signature: {
      type: String,
      required: true,
      // Chữ ký EIP-712 hoặc personal_sign từ wallet user
    },
    message_signed: {
      type: String,
      required: true,
      // Message gốc đã ký
    },
    signed_at: {
      type: Date,
      default: Date.now,
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

// Mỗi user chỉ consent 1 lần per loại
userConsentSchema.index({ user: 1, consent_type: 1 }, { unique: true });

const UserConsent = mongoose.model('UserConsent', userConsentSchema);

module.exports = UserConsent;
