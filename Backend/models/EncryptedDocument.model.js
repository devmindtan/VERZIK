const mongoose = require('mongoose');

const encryptedDocumentSchema = new mongoose.Schema(
  {
    file_name: {
      type: String,
      required: true,
      trim: true,
    },
    original_hash: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    issuer_address: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    file_cid: {
      type: String,
      required: true,
      trim: true,
    },
    metadata_cid: {
      type: String,
      required: true,
      trim: true,
    },
    directory_cid: {
      type: String,
      default: null,
      trim: true,
    },
    hashes: {
      ciphertext_hash: {
        type: String,
        required: true,
      },
      encryption_meta_hash: {
        type: String,
        default: null,
      },
    },
    keys: {
      encrypted_key: {
        type: String,
        required: true,
      },
      issuer_encrypted_key: {
        type: String,
        required: true,
      },
      recipient_keys: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
      nonce: {
        type: String,
        default: null,
      },
    },
    file_size: {
      type: Number,
      default: 0,
    },
    minio_object_key: {
      type: String,
      required: true,
    },
    tenant_id: {
      type: String,
      default: null,
      trim: true,
    },
    doc_type: {
      type: Number,
      default: 0,
      min: 0,
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    operator_nonce: {
      type: String,
      default: null,
    },
    deadline: {
      type: String,
      default: null,
    },
    tx_hash: {
      type: String,
      default: null,
    },
    anchor_error: {
      type: String,
      default: null,
    },
    anchored_at: {
      type: Date,
      default: null,
    },
    api_client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApiClient',
      default: null,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ANCHORED', 'FAILED'],
      default: 'PENDING',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
encryptedDocumentSchema.index({ issuer_address: 1 });
encryptedDocumentSchema.index({ status: 1 });
encryptedDocumentSchema.index({ api_client: 1 });
encryptedDocumentSchema.index({ metadata_cid: 1 });
encryptedDocumentSchema.index({ directory_cid: 1 });
encryptedDocumentSchema.index({ issuer_address: 1, status: 1, createdAt: -1 });

const EncryptedDocument = mongoose.model('EncryptedDocument', encryptedDocumentSchema);

module.exports = EncryptedDocument;
