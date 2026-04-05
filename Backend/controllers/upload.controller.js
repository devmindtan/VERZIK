const { ethers } = require('ethers');
const EncryptedDocument = require('../models/EncryptedDocument.model');
const minioService = require('../services/minio.service');
const blockchainService = require('../services/blockchain.service');
const activityService = require('../services/activity.service');

/**
 * POST /api/v1/upload-binary
 * Headers: X-Document-Hash, X-Metadata (JSON), X-Anchor-Payload (optional JSON)
 * Body: raw binary (application/octet-stream)
 *
 * Flow: 3-layer auth (middleware) → validate → MinIO → MongoDB → anchor on-chain (nếu có)
 */
const uploadBinary = async (req, res) => {
  try {
    // ─── Parse headers ───
    const documentHash = req.headers['x-document-hash'];
    const metadataRaw = req.headers['x-metadata'];

    if (!documentHash) {
      return res.status(400).json({ error: 'Missing X-Document-Hash header' });
    }

    if (!metadataRaw) {
      return res.status(400).json({ error: 'Missing X-Metadata header' });
    }

    let metadata;
    try {
      metadata = JSON.parse(metadataRaw);
    } catch {
      return res.status(400).json({ error: 'X-Metadata must be valid JSON' });
    }

    const { encrypted_key, nonce } = metadata;
    if (!encrypted_key || !nonce) {
      return res.status(400).json({ error: 'X-Metadata must contain encrypted_key and nonce' });
    }

    // ─── Binary data ───
    const encryptedData = req.body;
    if (!encryptedData || encryptedData.length === 0) {
      return res.status(400).json({ error: 'Empty request body — expected binary data' });
    }

    // ─── Duplicate check ───
    const existing = await EncryptedDocument.findOne({ document_hash: documentHash });
    if (existing) {
      return res.status(409).json({
        error: 'Document already uploaded',
        document_hash: documentHash,
        status: existing.status,
      });
    }

    // ─── Tính ciphertext_hash trên server ───
    const ciphertextHash = ethers.keccak256(encryptedData);

    // ─── Upload lên MinIO ───
    const objectKey = documentHash;
    await minioService.uploadFile(objectKey, encryptedData, 'application/octet-stream');

    // ─── Lưu metadata vào MongoDB ───
    const doc = await EncryptedDocument.create({
      document_hash: documentHash,
      ciphertext_hash: ciphertextHash,
      encryption_meta_hash: metadata.encryption_meta_hash || null,
      encrypted_key: encrypted_key,
      nonce: nonce,
      file_size: encryptedData.length,
      minio_object_key: objectKey,
      uploader_wallet: req.walletAddress || null,
      api_client: req.apiClient?._id || null,
    });

    // ─── On-chain anchoring (nếu client gửi anchor payload) ───
    let anchorResult = null;
    const anchorRaw = req.headers['x-anchor-payload'];
    if (anchorRaw) {
      try {
        const anchorPayload = JSON.parse(anchorRaw);
        const { tenant_id, doc_type, version, operator_nonce, deadline, signature } = anchorPayload;

        if (!tenant_id || !signature) {
          return res.status(400).json({ error: 'X-Anchor-Payload requires tenant_id and signature' });
        }

        anchorResult = await blockchainService.anchorDocument(
          {
            tenantId: tenant_id,
            fileHash: documentHash,
            cid: objectKey,
            ciphertextHash: ciphertextHash,
            encryptionMetaHash: metadata.encryption_meta_hash || ethers.ZeroHash,
            docType: doc_type || 0,
            version: version || 1,
            nonce: operator_nonce,
            deadline: deadline,
          },
          signature
        );

        doc.status = 'anchored';
        doc.tenant_id = tenant_id;
        doc.tx_hash = anchorResult.txHash;
        await doc.save();
      } catch (anchorError) {
        console.error('On-chain anchor failed:', anchorError.message);
        doc.status = 'failed';
        await doc.save();

        // Không fail toàn bộ request — file đã lưu MinIO thành công
        anchorResult = { error: anchorError.message };
      }
    }

    // ─── Activity log ───
    activityService.log({
      action: 'upload_encrypted',
      userId: null,
      resourceType: 'encrypted_document',
      resourceId: documentHash,
      metadata: {
        file_size: encryptedData.length,
        ciphertext_hash: ciphertextHash,
        wallet: req.walletAddress,
        client_id: req.apiClient?.client_id,
        anchored: doc.status === 'anchored',
      },
    }, req);

    return res.status(201).json({
      status: 'success',
      document_hash: documentHash,
      ciphertext_hash: ciphertextHash,
      file_size: encryptedData.length,
      anchor: anchorResult
        ? {
            status: doc.status,
            tx_hash: anchorResult.txHash || null,
            error: anchorResult.error || null,
          }
        : { status: 'pending', message: 'No anchor payload provided — document saved as pending' },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed' });
  }
};

/**
 * GET /api/v1/document/:hash/binary
 * Stream encrypted binary từ MinIO
 */
const serveBinary = async (req, res) => {
  try {
    const { hash } = req.params;

    const doc = await EncryptedDocument.findOne({ document_hash: hash });
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Set response headers
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Length': doc.file_size,
      'X-Document-Hash': doc.document_hash,
      'X-Metadata': JSON.stringify({
        encrypted_key: doc.encrypted_key,
        nonce: doc.nonce,
      }),
      'X-Ciphertext-Hash': doc.ciphertext_hash,
    });

    // Stream từ MinIO
    const stream = await minioService.getObjectStream(doc.minio_object_key);
    stream.pipe(res);
  } catch (error) {
    console.error('Serve binary error:', error);
    return res.status(500).json({ error: 'Failed to retrieve document' });
  }
};

/**
 * GET /api/v1/document/:hash/status
 * Trả trạng thái document (pending/anchored/failed)
 */
const getDocumentStatus = async (req, res) => {
  try {
    const { hash } = req.params;

    const doc = await EncryptedDocument.findOne({ document_hash: hash });
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    return res.json({
      document_hash: doc.document_hash,
      status: doc.status,
      ciphertext_hash: doc.ciphertext_hash,
      file_size: doc.file_size,
      tx_hash: doc.tx_hash,
      tenant_id: doc.tenant_id,
      created_at: doc.createdAt,
    });
  } catch (error) {
    console.error('Status error:', error);
    return res.status(500).json({ error: 'Failed to get document status' });
  }
};

/**
 * GET /api/v1/operator/nonce
 * Query params: tenant_id, operator_address
 * Lấy nonce hiện tại của operator từ smart contract
 */
const getOperatorNonce = async (req, res) => {
  try {
    const { tenant_id, operator_address } = req.query;

    if (!tenant_id || !operator_address) {
      return res.status(400).json({ error: 'Missing tenant_id or operator_address' });
    }

    const nonce = await blockchainService.getOperatorNonce(tenant_id, operator_address);
    return res.json({ tenant_id, operator_address, nonce: nonce.toString() });
  } catch (error) {
    console.error('Nonce query error:', error);
    return res.status(500).json({ error: 'Failed to query operator nonce' });
  }
};

module.exports = {
  uploadBinary,
  serveBinary,
  getDocumentStatus,
  getOperatorNonce,
};
