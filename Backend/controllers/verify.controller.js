const hashService = require('../services/hash.service');
const minioService = require('../services/minio.service');
const DocumentRecord = require('../models/DocumentRecord.model');
const EncryptedDocument = require('../models/EncryptedDocument.model');
const blockchainService = require('../services/blockchain.service');
const Identity = require('../models/Identity.model');
const viewlogService = require('../services/viewlog.service');
const activityService = require('../services/activity.service');

/**
 * Lấy identity + build auth proof cho user hiện tại
 */
const getAuthProofFromRequest = async (req) => {
  if (!req.user) {
    return viewlogService.buildAuthProof(null);
  }

  const identity = await Identity.findOne({ user: req.user._id, is_primary: true });
  if (!identity) {
    return viewlogService.buildAuthProof(null);
  }

  return viewlogService.buildAuthProof(identity, {
    walletSignature: req.body?.wallet_signature || req.headers['x-wallet-signature'] || null,
    googleIdToken: req.body?.google_id_token || req.headers['x-google-token'] || null,
  });
};

/**
 * POST /api/v1/verify — Public
 * Upload file → hash → check → trả kết quả
 * KHÔNG ghi audit log (ViewLog) — chỉ ghi activity log cho analytics
 */
const verifyDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File not found' });
    }

    const fileBuffer = req.file.buffer;
    const hash = hashService.hashDocument(fileBuffer);
    const encryptedDoc = await EncryptedDocument.findOne({
      original_hash: hash,
      status: 'ANCHORED',
    });
    const legacyRecord = await DocumentRecord.findOne({
      document_hash: hash,
      is_active: true,
    });

    let onChain = null;
    if (encryptedDoc?.tenant_id) {
      try {
        onChain = await blockchainService.verifyOnChain(encryptedDoc.tenant_id, hash);
      } catch (verifyErr) {
        console.warn('Verify on-chain check warning:', verifyErr.message || verifyErr);
      }
    }

    const isVerifiedByOnChain = Boolean(onChain?.exists && onChain?.isValid);
    const isVerifiedByAnchoredDb = Boolean(encryptedDoc);
    const isVerifiedByLegacyDb = Boolean(legacyRecord);
    const result = (isVerifiedByOnChain || isVerifiedByAnchoredDb || isVerifiedByLegacyDb)
      ? 'verified'
      : 'not_verified';

    // Activity log cho báo cáo/biểu đồ (không cần tamper-proof)
    activityService.log({
      action: 'verify',
      userId: req.user?._id || null,
      resourceType: 'document',
      resourceId: hash,
      metadata: {
        file_name: req.file.originalname,
        file_size: req.file.size,
        file_type: req.file.mimetype,
        result: result,
        organization: legacyRecord?.organization_name || null,
        tenant_id: encryptedDoc?.tenant_id || null,
        tx_hash: encryptedDoc?.tx_hash || null,
        verify_source: isVerifiedByOnChain
          ? 'onchain'
          : (isVerifiedByAnchoredDb ? 'anchored_db' : (isVerifiedByLegacyDb ? 'legacy_db' : null)),
      },
    }, req);

    if (isVerifiedByOnChain || isVerifiedByAnchoredDb || isVerifiedByLegacyDb) {
      const organization = legacyRecord?.organization_name || 'VoucherProtocol';
      const verifiedAt = encryptedDoc?.anchored_at || legacyRecord?.createdAt || null;
      return res.json({
        status: 'verified',
        message: `Tài liệu này được xác minh bởi ${organization}`,
        documentHash: hash,
        organization,
        verifiedAt,
        fileName: req.file.originalname,
        source: isVerifiedByOnChain
          ? 'onchain'
          : (isVerifiedByAnchoredDb ? 'anchored_db' : 'legacy_db'),
        onChain: onChain ? {
          exists: !!onChain.exists,
          isValid: !!onChain.isValid,
          issuer: onChain.issuer,
          cid: onChain.cid,
        } : null,
        anchor: encryptedDoc ? {
          tenant_id: encryptedDoc.tenant_id,
          tx_hash: encryptedDoc.tx_hash,
          metadata_cid: encryptedDoc.metadata_cid,
          anchored_at: encryptedDoc.anchored_at,
        } : null,
      });
    }

    return res.json({
      status: 'not_verified',
      message: 'Tài liệu này chưa được chứng thực',
      documentHash: hash,
      fileName: req.file.originalname,
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/v1/view — Authenticated
 * Body: { access_code, wallet_signature?, google_id_token? }
 * GHI CẢ audit log (ViewLog, tamper-proof) + activity log (analytics)
 */
const viewDocument = async (req, res) => {
  try {
    const { access_code } = req.body;

    if (!access_code) {
      return res.status(400).json({ error: 'Mã truy cập là bắt buộc' });
    }

    // Kiểm tra consent
    const hasConsent = await viewlogService.hasUserConsent(req.user._id);
    if (!hasConsent) {
      return res.status(403).json({
        error: 'Bạn cần xác nhận đồng ý theo dõi lịch sử xem trước khi sử dụng',
        requires_consent: true,
      });
    }

    // Tìm document record
    const record = await DocumentRecord.findOne({
      access_code: access_code,
      is_active: true,
    });

    if (!record) {
      return res.status(404).json({ error: 'Mã truy cập không hợp lệ hoặc tài liệu không tồn tại' });
    }

    // Presigned URL
    const fileUrl = record.file_url;
    const fileName = fileUrl.split('/').pop();
    const presignedUrl = await minioService.getPresignedUrl(fileName);

    // Build auth proof (unforgeable)
    const authProof = await getAuthProofFromRequest(req);

    // AUDIT LOG — tamper-proof hash chain + auth proof
    const viewLog = await viewlogService.createChainedLog(
      {
        user: req.user._id,
        document_hash: record.document_hash,
        file_name: record.file_name,
        action: 'view',
        ip_address: req.ip || req.connection?.remoteAddress,
        user_agent: req.headers['user-agent'],
      },
      authProof
    );

    // ACTIVITY LOG — cho analytics/biểu đồ
    activityService.log({
      action: 'view',
      userId: req.user._id,
      resourceType: 'document',
      resourceId: record.document_hash,
      metadata: {
        file_name: record.file_name,
        organization: record.organization_name,
        access_code_used: true,
        audit_log_hash: viewLog.log_hash,
      },
    }, req);

    // Receipt — user giữ làm bằng chứng
    const receipt = {
      chain_index: viewLog.chain_index,
      log_hash: viewLog.log_hash,
      auth_type: viewLog.auth_proof_type,
      auth_address: viewLog.auth_address,
      signed: !!viewLog.auth_proof,
      timestamp: viewLog.viewed_at,
    };

    return res.json({
      status: 'success',
      message: 'Quyền xem hợp lệ',
      document: {
        hash: record.document_hash,
        fileName: record.file_name,
        fileType: record.file_type,
        organization: record.organization_name,
        verifiedAt: record.createdAt,
      },
      viewUrl: presignedUrl,
      expiresIn: `${process.env.VIEW_TOKEN_TTL_SECONDS || 300} seconds`,
      receipt,
    });
  } catch (error) {
    console.error('View error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/v1/consent — Authenticated
 */
const submitConsent = async (req, res) => {
  try {
    const { signature, message, wallet_address, google_id_token } = req.body;

    const existing = await viewlogService.hasUserConsent(req.user._id);
    if (existing) {
      return res.json({ status: 'already_consented', message: 'Bạn đã xác nhận trước đó' });
    }

    const identity = await Identity.findOne({ user: req.user._id, is_primary: true });

    let consent;

    if (identity?.provider === 'wallet' && signature && message) {
      const walletAddr = wallet_address || identity.provider_id;
      consent = await viewlogService.saveWalletConsent(req.user._id, walletAddr, signature, message);
    } else if (identity?.provider === 'google' && google_id_token) {
      const email = identity.metadata?.email || identity.provider_id;
      consent = await viewlogService.saveGoogleConsent(req.user._id, email, google_id_token);
    } else {
      return res.status(400).json({
        error: 'Thiếu thông tin xác nhận. Wallet user cần { signature, message }, Google user cần { google_id_token }',
      });
    }

    // Activity log
    activityService.log({
      action: 'consent',
      userId: req.user._id,
      resourceType: 'user',
      resourceId: req.user._id.toString(),
      metadata: { provider: identity.provider },
    }, req);

    return res.json({
      status: 'success',
      message: 'Xác nhận thành công. Bạn có thể xem tài liệu.',
      consent_id: consent._id,
    });
  } catch (error) {
    console.error('Consent error:', error);
    if (error.message.includes('Chữ ký không hợp lệ')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/v1/consent/message — Authenticated
 */
const getConsentMessage = async (req, res) => {
  try {
    const existing = await viewlogService.hasUserConsent(req.user._id);
    if (existing) {
      return res.json({ status: 'already_consented' });
    }

    const identity = await Identity.findOne({ user: req.user._id, is_primary: true });

    if (!identity) {
      return res.status(400).json({ error: 'Không tìm thấy identity. Bạn cần liên kết tài khoản trước.' });
    }

    const address = identity.provider === 'wallet'
      ? identity.provider_id
      : (identity.metadata?.email || identity.provider_id);

    const consentMessage = viewlogService.generateConsentMessage(address);

    return res.json({
      status: 'pending',
      provider: identity.provider,
      message_to_sign: consentMessage,
      address: address,
    });
  } catch (error) {
    console.error('Get consent message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/v1/logs/verify — Public
 */
const verifyLogChain = async (req, res) => {
  try {
    const result = await viewlogService.verifyChain();
    return res.json(result);
  } catch (error) {
    console.error('Chain verify error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  verifyDocument,
  viewDocument,
  submitConsent,
  getConsentMessage,
  verifyLogChain,
};
