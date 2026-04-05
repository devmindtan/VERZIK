const mongoose = require('mongoose');

const identitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    provider: {
      type: String,
      enum: ['wallet', 'google'],
      required: true,
    },
    provider_id: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      email: {
        type: String,
        trim: true,
        lowercase: true,
        default: null,
      },
      display_name: {
        type: String,
        trim: true,
        default: null,
      },
      avatar_url: {
        type: String,
        default: null,
      },
    },
    is_primary: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Mỗi wallet address hoặc Google sub ID chỉ liên kết 1 lần
identitySchema.index({ provider: 1, provider_id: 1 }, { unique: true });
// Truy vấn nhanh tất cả identities của user
identitySchema.index({ user: 1 });

const Identity = mongoose.model('Identity', identitySchema);

module.exports = Identity;
