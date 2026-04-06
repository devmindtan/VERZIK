const express = require('express');
const multer = require('multer');
const router = express.Router();
const { apiKeyAuth } = require('../../middlewares/apikey.middleware');
const uploadController = require('../../controllers/upload.controller');

/**
 * Upload middleware cho encrypted binary (multipart/form-data)
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

/**
 * API 1: POST /api/v1/upload
 * multipart/form-data:
 * - encrypted_file (binary)
 * - original_hash (string)
 * - hashes (JSON string)
 * - keys (JSON string)
 * - anchor_payload (JSON string, optional)
 */
router.post(
  '/upload',
  apiKeyAuth,
  upload.single('encrypted_file'),
  uploadController.uploadDraft
);

/**
 * API 2: GET /api/v1/documents/pending
 */
router.get(
  '/documents/pending',
  apiKeyAuth,
  uploadController.getPendingDocuments
);

/**
 * API 3: POST /api/v1/anchor
 * Body JSON: { original_hash, signature }
 */
router.post(
  '/anchor',
  apiKeyAuth,
  uploadController.anchorDocument
);

/**
 * Utility: stream encrypted data từ MinIO cache
 */
router.get('/document/:hash/binary', uploadController.serveBinary);

/**
 * Utility: status theo original_hash
 */
router.get('/document/:hash/status', uploadController.getDocumentStatus);

/**
 * Utility: query operator nonce từ smart contract
 */
router.get('/operator/nonce', uploadController.getOperatorNonce);

module.exports = router;
