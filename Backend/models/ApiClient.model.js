const mongoose = require('mongoose');

const apiClientSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    client_id: {
      type: String,
      required: true,
      unique: true,
    },
    client_secret_hash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    permissions: {
      type: [String],
      default: ['push_verification'],
      enum: ['push_verification', 'upload'],
    },
    whitelisted_wallets: {
      type: [String],
      default: [],
    },
    last_used_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
apiClientSchema.index({ user: 1 });

const ApiClient = mongoose.model('ApiClient', apiClientSchema);

module.exports = ApiClient;
