const mongoose = require('mongoose');

const encryptedDocumentSchema = new mongoose.Schema(
  {
    document_hash: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    ciphertext_hash: {
      type: String,
      default: null,
    },
    encryption_meta_hash: {
      type: String,
      default: null,
    },
    encrypted_key: {
      type: String,
      required: true,
    },
    nonce: {
      type: String,
      required: true,
    },
    file_size: {
      type: Number,
      default: 0,
    },
    minio_object_key: {
      type: String,
      required: true,
    },
    uploader_wallet: {
      type: String,
      lowercase: true,
      default: null,
    },
    api_client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApiClient',
      default: null,
    },
    tenant_id: {
      type: String,
      default: null,
    },
    tx_hash: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'anchored', 'failed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
encryptedDocumentSchema.index({ uploader_wallet: 1 });
encryptedDocumentSchema.index({ status: 1 });
encryptedDocumentSchema.index({ api_client: 1 });

const EncryptedDocument = mongoose.model('EncryptedDocument', encryptedDocumentSchema);

module.exports = EncryptedDocument;
