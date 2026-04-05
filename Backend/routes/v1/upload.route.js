const express = require('express');
const router = express.Router();
const { apiKeyAuth } = require('../../middlewares/apikey.middleware');
const uploadController = require('../../controllers/upload.controller');

/**
 * POST /api/v1/upload-binary
 * Body: raw binary (application/octet-stream)
 * Auth: 3-layer (X-Client-Id, X-Client-Secret, X-Wallet-Address, X-Signature, X-Timestamp)
 * Data: X-Document-Hash, X-Metadata (JSON), X-Anchor-Payload (optional JSON)
 */
router.post(
  '/upload-binary',
  express.raw({ type: 'application/octet-stream', limit: '50mb' }),
  apiKeyAuth,
  uploadController.uploadBinary
);

/**
 * GET /api/v1/document/:hash/binary
 * Stream encrypted data từ MinIO
 */
router.get('/document/:hash/binary', uploadController.serveBinary);

/**
 * GET /api/v1/document/:hash/status
 * Trả trạng thái document
 */
router.get('/document/:hash/status', uploadController.getDocumentStatus);

/**
 * GET /api/v1/operator/nonce?tenant_id=0x...&operator_address=0x...
 * Query operator nonce từ smart contract
 */
router.get('/operator/nonce', uploadController.getOperatorNonce);

module.exports = router;
