const express = require('express');
const router = express.Router();
const multer = require('multer');

const uploadMiddleware = require('../../middlewares/upload.middleware');
const { requireAuth, optionalAuth } = require('../../middlewares/auth.middleware');
const verifyController = require('../../controllers/verify.controller');

const upload = uploadMiddleware.single('file');

/**
 * POST /api/v1/verify — Public
 * Upload file → hash → check blockchain (stub) → kết quả
 */
router.post('/verify', optionalAuth, (req, res, next) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        error: 'Lỗi đính kèm file!',
        detail: `Error: ${err.message}. `,
      });
    } else if (err) {
      return res.status(400).json({
        error: 'File không hợp lệ!',
        detail: err.message,
      });
    }
    next();
  });
}, verifyController.verifyDocument);

/**
 * POST /api/v1/view — Authenticated
 * Body: { access_code } → check consent → xem nội dung
 */
router.post('/view', requireAuth, verifyController.viewDocument);

/**
 * GET /api/v1/consent/message — Authenticated
 * Lấy message cần ký cho consent
 */
router.get('/consent/message', requireAuth, verifyController.getConsentMessage);

/**
 * POST /api/v1/consent — Authenticated
 * Body: { signature, message, wallet_address } → ký consent 1 lần
 */
router.post('/consent', requireAuth, verifyController.submitConsent);

/**
 * GET /api/v1/logs/verify — Public
 * Kiểm tra chain integrity — ai cũng có thể verify
 */
router.get('/logs/verify', verifyController.verifyLogChain);

module.exports = router;