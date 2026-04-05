const mongoose = require('mongoose');

const viewLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    document_hash: {
      type: String,
      required: true,
      trim: true,
    },
    file_name: {
      type: String,
      trim: true,
      default: null,
    },
    action: {
      type: String,
      enum: ['view', 'verify', 'download'],
      required: true,
    },
    ip_address: {
      type: String,
      default: null,
    },
    user_agent: {
      type: String,
      default: null,
    },
    viewed_at: {
      type: Date,
      default: Date.now,
    },

    // ===== Hash Chain Fields =====
    chain_index: {
      type: Number,
      required: true,
      unique: true,
    },
    prev_log_hash: {
      type: String,
      required: true,
      default: '0x0000000000000000000000000000000000000000000000000000000000000000',
    },
    log_hash: {
      type: String,
      required: true,
    },

    // ===== Auth Proof (không thể giả mạo) =====
    auth_proof_type: {
      type: String,
      enum: ['wallet_signature', 'google_token', 'anonymous'],
      required: true,
    },
    auth_proof: {
      type: String,
      default: null,
      // wallet_signature → chữ ký từ MetaMask (admin KHÔNG có private key)
      // google_token → keccak256(id_token) — JWT do Google ký, admin KHÔNG giả được
      // anonymous → null
    },
    auth_address: {
      type: String,
      default: null,
      // wallet → address, google → email
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
viewLogSchema.index({ user: 1, document_hash: 1 });
viewLogSchema.index({ document_hash: 1 });
viewLogSchema.index({ viewed_at: -1 });
viewLogSchema.index({ log_hash: 1 });

const ViewLog = mongoose.model('ViewLog', viewLogSchema);

module.exports = ViewLog;
