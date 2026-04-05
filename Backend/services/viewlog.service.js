/**
 * ViewLog Service — Hash Chain + Auth Proof
 *
 * 2 lớp bảo vệ chống giả mạo:
 *
 * LỚP 1 — Hash Chain: mỗi log link tới log trước → sửa 1 record phá toàn chain
 *
 * LỚP 2 — Auth Proof (admin KHÔNG THỂ giả mạo):
 *   - Wallet user: signature từ MetaMask (private key nằm ở trình duyệt user)
 *   - Google user: keccak256(Google id_token) — JWT do Google ký bằng private key của Google
 *   - Anonymous: không có proof
 */

const { ethers } = require('ethers');
const ViewLog = require('../models/ViewLog.model');
const UserConsent = require('../models/UserConsent.model');
const Wallet = require('../models/Wallet.model');

/**
 * Tính hash cho 1 log entry bằng keccak256
 * Hash = keccak256(chain_index | user | document_hash | action | viewed_at | prev_log_hash | auth_proof)
 *
 * auth_proof nằm trong hash → nếu admin sửa proof thì hash sai → chain broken
 * admin không có private key của MetaMask hay Google → không tạo lại proof được
 */
const computeLogHash = (logData) => {
  const payload = [
    logData.chain_index.toString(),
    logData.user ? logData.user.toString() : 'anonymous',
    logData.document_hash,
    logData.action,
    logData.viewed_at.toISOString(),
    logData.prev_log_hash,
    logData.auth_proof || 'no_proof',
  ].join('|');

  return ethers.keccak256(ethers.toUtf8Bytes(payload));
};

/**
 * Tạo ViewLog mới, link vào chain
 *
 * @param {Object} data - { user, document_hash, file_name, action, ip_address, user_agent }
 * @param {Object} authProof - { type, proof, address }
 *   type: 'wallet_signature' | 'google_token' | 'anonymous'
 *   proof: signature string hoặc token hash
 *   address: wallet address hoặc email
 * @returns {Object} ViewLog entry với log_hash (receipt cho user)
 */
const createChainedLog = async (data, authProof = { type: 'anonymous', proof: null, address: null }) => {
  // Lấy log cuối cùng trong chain
  const lastLog = await ViewLog.findOne().sort({ chain_index: -1 }).lean();

  const chainIndex = lastLog ? lastLog.chain_index + 1 : 0;
  const prevLogHash = lastLog
    ? lastLog.log_hash
    : '0x0000000000000000000000000000000000000000000000000000000000000000';

  const viewedAt = new Date();

  // Tính hash — bao gồm auth_proof
  const logData = {
    chain_index: chainIndex,
    user: data.user,
    document_hash: data.document_hash,
    action: data.action,
    viewed_at: viewedAt,
    prev_log_hash: prevLogHash,
    auth_proof: authProof.proof,
  };

  const logHash = computeLogHash(logData);

  // Tạo ViewLog entry
  const viewLog = await ViewLog.create({
    user: data.user,
    document_hash: data.document_hash,
    file_name: data.file_name,
    action: data.action,
    ip_address: data.ip_address,
    user_agent: data.user_agent,
    viewed_at: viewedAt,
    chain_index: chainIndex,
    prev_log_hash: prevLogHash,
    log_hash: logHash,
    auth_proof_type: authProof.type,
    auth_proof: authProof.proof,
    auth_address: authProof.address,
  });

  return viewLog;
};

/**
 * Tạo auth proof tùy theo loại user
 *
 * Wallet user → cần signature từ frontend (truyền vào)
 * Google user → hash id_token (JWT do Google ký)
 * Anonymous → no proof
 */
const buildAuthProof = (identity, options = {}) => {
  if (!identity) {
    return { type: 'anonymous', proof: null, address: null };
  }

  if (identity.provider === 'wallet') {
    // Wallet user: signature phải từ frontend (MetaMask personal_sign)
    // Admin KHÔNG có private key → KHÔNG giả được
    if (options.walletSignature) {
      return {
        type: 'wallet_signature',
        proof: options.walletSignature,
        address: identity.provider_id,
      };
    }
    // Fallback: không có signature → vẫn ghi log nhưng không có proof
    return { type: 'anonymous', proof: null, address: identity.provider_id };
  }

  if (identity.provider === 'google') {
    // Google user: hash Google id_token
    // id_token là JWT signed bởi Google → admin KHÔNG có Google private key → KHÔNG giả được
    if (options.googleIdToken) {
      const tokenHash = ethers.keccak256(ethers.toUtf8Bytes(options.googleIdToken));
      return {
        type: 'google_token',
        proof: tokenHash,
        address: identity.metadata?.email || identity.provider_id,
      };
    }
    return { type: 'anonymous', proof: null, address: identity.metadata?.email || identity.provider_id };
  }

  return { type: 'anonymous', proof: null, address: null };
};

/**
 * Verify toàn bộ chain integrity
 */
const verifyChain = async () => {
  const logs = await ViewLog.find().sort({ chain_index: 1 }).lean();

  if (logs.length === 0) {
    return { valid: true, total: 0, message: 'Chain trống' };
  }

  const genesisHash = '0x0000000000000000000000000000000000000000000000000000000000000000';

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];

    if (log.chain_index !== i) {
      return {
        valid: false,
        total: logs.length,
        broken_at: i,
        details: `Chain index gap: expected ${i}, got ${log.chain_index}`,
      };
    }

    const expectedPrevHash = i === 0 ? genesisHash : logs[i - 1].log_hash;
    if (log.prev_log_hash !== expectedPrevHash) {
      return {
        valid: false,
        total: logs.length,
        broken_at: i,
        details: `prev_log_hash mismatch at index ${i}`,
      };
    }

    const computedHash = computeLogHash({
      chain_index: log.chain_index,
      user: log.user,
      document_hash: log.document_hash,
      action: log.action,
      viewed_at: new Date(log.viewed_at),
      prev_log_hash: log.prev_log_hash,
      auth_proof: log.auth_proof,
    });

    if (computedHash !== log.log_hash) {
      return {
        valid: false,
        total: logs.length,
        broken_at: i,
        details: `log_hash tampered at index ${i}. Expected: ${computedHash}, Got: ${log.log_hash}`,
      };
    }
  }

  return {
    valid: true,
    total: logs.length,
    latest_hash: logs[logs.length - 1].log_hash,
    message: `Chain hợp lệ — ${logs.length} entries verified`,
  };
};

/**
 * Kiểm tra user đã consent chưa
 */
const hasUserConsent = async (userId) => {
  const consent = await UserConsent.findOne({
    user: userId,
    consent_type: 'view_document',
    is_active: true,
  });
  return !!consent;
};

/**
 * Tạo consent message
 */
const generateConsentMessage = (address) => {
  const timestamp = new Date().toISOString();
  return `[VietFuture] Tôi (${address}) xác nhận đồng ý với việc hệ thống ghi lại lịch sử xem tài liệu. Mỗi lần tôi xem hoặc tải xuống tài liệu sẽ được ghi nhận trên hash chain và tôi chịu trách nhiệm với các hành động này. Timestamp: ${timestamp}`;
};

/**
 * Verify wallet signature consent (MetaMask)
 */
const saveWalletConsent = async (userId, walletAddress, signature, message) => {
  const recoveredAddress = ethers.verifyMessage(message, signature);

  if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
    throw new Error('Chữ ký không hợp lệ — địa chỉ ví không khớp');
  }

  const consent = await UserConsent.create({
    user: userId,
    consent_type: 'view_document',
    wallet_address: walletAddress.toLowerCase(),
    signature: signature,
    message_signed: message,
  });

  return consent;
};

/**
 * Save Google user consent (dùng email làm identity)
 */
const saveGoogleConsent = async (userId, email, googleIdToken) => {
  const tokenHash = ethers.keccak256(ethers.toUtf8Bytes(googleIdToken));

  const consent = await UserConsent.create({
    user: userId,
    consent_type: 'view_document',
    wallet_address: email,
    signature: tokenHash, // hash of Google JWT as proof
    message_signed: `Google OAuth consent by ${email}`,
  });

  return consent;
};

/**
 * Lấy wallet address của user
 */
const getUserWalletAddress = async (userId) => {
  const wallet = await Wallet.findOne({ user: userId });
  return wallet ? wallet.address : null;
};

module.exports = {
  computeLogHash,
  createChainedLog,
  buildAuthProof,
  verifyChain,
  hasUserConsent,
  generateConsentMessage,
  saveWalletConsent,
  saveGoogleConsent,
  getUserWalletAddress,
};
