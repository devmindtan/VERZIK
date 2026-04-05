/**
 * Anchor Worker — Background process xử lý on-chain anchoring
 *
 * Luồng Event-Driven:
 * 1. Upload controller lưu document ở trạng thái PENDING
 * 2. Worker poll DB định kỳ → tìm documents PENDING có anchor_payload
 * 3. Gửi transaction lên blockchain
 * 4. Thành công → update ANCHORED + tx_hash
 * 5. Thất bại → tăng retry_count, nếu quá max → FAILED
 */

const EncryptedDocument = require('../models/EncryptedDocument.model');
const blockchainService = require('./blockchain.service');
const { ethers } = require('ethers');

const MAX_RETRIES = 5;
const POLL_INTERVAL_MS = 10_000; // 10 giây

let isRunning = false;
let intervalId = null;

/**
 * Xử lý 1 document pending
 */
const processDocument = async (doc) => {
  try {
    const payload = doc.anchor_payload;
    if (!payload || !payload.signature) {
      console.log(`  ⏭️  ${doc.document_hash.substring(0, 16)}... — no anchor payload, skipping`);
      return;
    }

    console.log(`  ⛓️  Anchoring ${doc.document_hash.substring(0, 16)}... (attempt ${doc.retry_count + 1}/${MAX_RETRIES})`);

    const result = await blockchainService.anchorDocument(
      {
        tenantId: payload.tenant_id,
        fileHash: doc.document_hash,
        cid: doc.cid,
        ciphertextHash: doc.ciphertext_hash || ethers.ZeroHash,
        encryptionMetaHash: doc.encryption_meta_hash || ethers.ZeroHash,
        docType: payload.doc_type || 0,
        version: payload.version || 1,
        nonce: payload.operator_nonce,
        deadline: payload.deadline,
      },
      payload.signature
    );

    // ✅ Thành công
    doc.status = 'anchored';
    doc.tx_hash = result.txHash;
    doc.anchor_error = null;
    await doc.save();

    console.log(`  ✅ Anchored! tx: ${result.txHash}`);
  } catch (error) {
    doc.retry_count = (doc.retry_count || 0) + 1;
    doc.anchor_error = error.message;

    if (doc.retry_count >= MAX_RETRIES) {
      doc.status = 'failed';
      console.error(`  ❌ Permanently failed after ${MAX_RETRIES} attempts: ${error.message}`);
    } else {
      console.warn(`  ⚠️  Attempt ${doc.retry_count} failed: ${error.message} — will retry`);
    }

    await doc.save();
  }
};

/**
 * 1 vòng poll: tìm tất cả documents PENDING có anchor_payload và xử lý
 */
const pollOnce = async () => {
  if (isRunning) return;
  isRunning = true;

  try {
    const pendingDocs = await EncryptedDocument.find({
      status: 'pending',
      anchor_payload: { $ne: null },
      retry_count: { $lt: MAX_RETRIES },
    }).limit(10);

    if (pendingDocs.length > 0) {
      console.log(`\n🔄 Anchor Worker: Found ${pendingDocs.length} pending document(s)`);

      for (const doc of pendingDocs) {
        await processDocument(doc);
      }
    }
  } catch (error) {
    console.error('Anchor Worker poll error:', error.message);
  } finally {
    isRunning = false;
  }
};

/**
 * Khởi động worker (gọi từ index.js sau khi server start)
 */
const start = () => {
  console.log(`⛓️  Anchor Worker started (poll every ${POLL_INTERVAL_MS / 1000}s, max ${MAX_RETRIES} retries)`);
  intervalId = setInterval(pollOnce, POLL_INTERVAL_MS);

  // Chạy ngay lần đầu sau 3 giây
  setTimeout(pollOnce, 3000);
};

/**
 * Dừng worker
 */
const stop = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('⛓️  Anchor Worker stopped');
  }
};

/**
 * Trigger xử lý ngay (gọi sau upload thành công để không phải chờ poll interval)
 */
const triggerNow = () => {
  setImmediate(pollOnce);
};

module.exports = { start, stop, triggerNow, pollOnce };
