const mongoose = require('mongoose');
const crypto = require('crypto');

const documentRecordSchema = new mongoose.Schema(
  {
    document_hash: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    issuer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organization_name: {
      type: String,
      required: true,
      trim: true,
    },
    file_name: {
      type: String,
      trim: true,
      default: null,
    },
    file_type: {
      type: String,
      default: null,
    },
    file_url: {
      type: String,
      default: null,
    },
    access_code: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(16).toString('hex'),
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
documentRecordSchema.index({ issuer: 1 });

const DocumentRecord = mongoose.model('DocumentRecord', documentRecordSchema);

module.exports = DocumentRecord;
