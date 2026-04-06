const { ethers } = require('ethers');
const EncryptedDocument = require('../models/EncryptedDocument.model');
const minioService = require('../services/minio.service');
const ipfsService = require('../services/ipfs.service');
const blockchainService = require('../services/blockchain.service');
const activityService = require('../services/activity.service');

const parseJsonField = (value, fieldName, { required = false } = {}) => {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new Error(`${fieldName} is required`);
    }
    return null;
  }

  if (typeof value === 'object') {
    return value;
  }

  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be JSON string`);
  }

  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`${fieldName} must be valid JSON`);
  }
};

/**
 * API 1: POST /api/v1/upload
 * multipart/form-data:
 * - encrypted_file: binary file
 * - original_hash: bytes32 hash
 * - hashes: JSON string
 * - keys: JSON string
 * - anchor_payload: JSON string (optional)
 */
const uploadDraft = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer || req.file.size === 0) {
      return res.status(400).json({ error: 'Missing encrypted_file in multipart form-data' });
    }

    const originalHash = req.body.original_hash || req.body.document_hash;
    if (!originalHash) {
      return res.status(400).json({ error: 'Missing original_hash' });
    }

    let hashes;
    let keys;
    let anchorPayload;
    try {
      hashes = parseJsonField(req.body.hashes, 'hashes') || {};
      keys = parseJsonField(req.body.keys, 'keys') || {};
      anchorPayload = parseJsonField(req.body.anchor_payload, 'anchor_payload') || {};
    } catch (parseError) {
      return res.status(400).json({ error: parseError.message });
    }

    hashes = {
      ciphertext_hash: hashes.ciphertext_hash || req.body.ciphertext_hash || null,
      encryption_meta_hash: hashes.encryption_meta_hash || req.body.encryption_meta_hash || null,
    };

    if (!hashes.ciphertext_hash) {
      return res.status(400).json({ error: 'hashes.ciphertext_hash is required' });
    }
    keys = {
      encrypted_key: keys.encrypted_key || req.body.encrypted_key || null,
      issuer_encrypted_key: keys.issuer_encrypted_key || req.body.issuer_encrypted_key || null,
      recipient_keys: keys.recipient_keys || {},
      nonce: keys.nonce || req.body.nonce || null,
    };

    if (!keys.encrypted_key || !keys.issuer_encrypted_key) {
      return res.status(400).json({ error: 'keys.encrypted_key and keys.issuer_encrypted_key are required' });
    }

    const existing = await EncryptedDocument.findOne({ original_hash: originalHash });
    if (existing) {
      return res.status(409).json({
        error: 'Document already exists',
        original_hash: originalHash,
        status: existing.status,
      });
    }

    const encryptedData = req.file.buffer;
    const fileName = req.file.originalname || `${originalHash}.bin`;

    // 1) Add đơn lẻ /api/v0/add
    const singleFileAdd = await ipfsService.addSingle(
      encryptedData,
      fileName,
      'application/octet-stream'
    );
    const fileCID = singleFileAdd.cid;

    // 2) Tạo metadata JSON + upload metadata lên IPFS
    const metadataPayload = {
      file_pointer: `ipfs://${fileCID}`,
      file_cid: fileCID,
      original_hash: originalHash,
      issuer_address: req.walletAddress,
      hashes: {
        ciphertext_hash: hashes.ciphertext_hash,
        encryption_meta_hash: hashes.encryption_meta_hash || null,
      },
      keys: {
        encrypted_key: keys.encrypted_key,
        issuer_encrypted_key: keys.issuer_encrypted_key,
        recipient_keys: keys.recipient_keys,
        nonce: keys.nonce,
      },
      file_name: fileName,
      uploaded_at: new Date().toISOString(),
    };

    // 2) Add file + metadata /api/v0/add?wrap-with-directory=true
    const metadataFileName = `${originalHash}.metadata.json`;
    const metadataBuffer = Buffer.from(JSON.stringify(metadataPayload), 'utf8');
    const wrappedAdd = await ipfsService.addWithMetadataDirectory({
      fileData: encryptedData,
      fileName,
      metadataData: metadataBuffer,
      metadataFileName,
      directoryName: originalHash,
    });
    if (wrappedAdd.fileCid && wrappedAdd.fileCid !== fileCID) {
      console.warn(`IPFS file CID mismatch: single=${fileCID}, wrapped=${wrappedAdd.fileCid}`);
    }

    let metadataCID = wrappedAdd.metadataCid;
    if (!metadataCID) {
      const fallbackMetadataAdd = await ipfsService.addSingle(
        metadataBuffer,
        metadataFileName,
        'application/json'
      );
      metadataCID = fallbackMetadataAdd.cid;
    }

    // 3) Pin CIDs /api/v0/pin/add?arg=
    await ipfsService.pin(fileCID);
    await ipfsService.pin(metadataCID);
    if (wrappedAdd.directoryCid) {
      await ipfsService.pin(wrappedAdd.directoryCid);
    }

    // 3) Cache binary về MinIO để serve nhanh
    const objectKey = `documents/${originalHash}.bin`;
    await minioService.uploadFile(objectKey, encryptedData, 'application/octet-stream');

    // 4) Lưu DB dạng PENDING (lazy minting)
    const doc = await EncryptedDocument.create({
      file_name: fileName,
      original_hash: originalHash,
      issuer_address: req.walletAddress,
      file_cid: fileCID,
      metadata_cid: metadataCID,
      directory_cid: wrappedAdd.directoryCid || null,
      hashes: {
        ciphertext_hash: hashes.ciphertext_hash,
        encryption_meta_hash: hashes.encryption_meta_hash || null,
      },
      keys: {
        encrypted_key: keys.encrypted_key,
        issuer_encrypted_key: keys.issuer_encrypted_key,
        recipient_keys: keys.recipient_keys,
        nonce: keys.nonce,
      },
      file_size: req.file.size,
      minio_object_key: objectKey,
      tenant_id: anchorPayload.tenant_id || null,
      doc_type: anchorPayload.doc_type ?? 0,
      version: anchorPayload.version ?? 1,
      operator_nonce: anchorPayload.operator_nonce ?? null,
      deadline: anchorPayload.deadline ?? null,
      api_client: req.apiClient?._id || null,
      status: 'PENDING',
    });

    activityService.log({
      action: 'upload_draft',
      userId: null,
      resourceType: 'encrypted_document',
      resourceId: originalHash,
      metadata: {
        file_name: fileName,
        file_size: req.file.size,
        file_cid: fileCID,
        metadata_cid: metadataCID,
        directory_cid: wrappedAdd.directoryCid || null,
        wallet: req.walletAddress,
        client_id: req.apiClient?.client_id,
      },
    }, req);

    return res.status(201).json({
      status: 'success',
      document: {
        file_name: doc.file_name,
        original_hash: doc.original_hash,
        cid: doc.metadata_cid,
        metadata_cid: doc.metadata_cid,
        file_cid: doc.file_cid,
        directory_cid: doc.directory_cid,
        nonce: doc.operator_nonce,
        draft_status: doc.status,
        created_at: doc.createdAt,
      },
    });
  } catch (error) {
    console.error('Upload draft error:', error);
    return res.status(500).json({ error: 'Upload failed' });
  }
};

/**
 * API 2: GET /api/v1/documents/pending
 * Lấy các tài liệu PENDING của issuer hiện tại.
 */
const getPendingDocuments = async (req, res) => {
  try {
    const docs = await EncryptedDocument.find({
      issuer_address: req.walletAddress,
      status: 'PENDING',
    }).sort({ createdAt: -1 });

    const pending = docs.map((doc) => ({
      file_name: doc.file_name,
      upload_date: doc.createdAt,
      original_hash: doc.original_hash,
      cid: doc.metadata_cid,
      metadata_cid: doc.metadata_cid,
      file_cid: doc.file_cid,
      directory_cid: doc.directory_cid,
      nonce: doc.operator_nonce,
      encryption_nonce: doc.keys?.nonce || null,
      tenant_id: doc.tenant_id,
      status: doc.status,
    }));

    return res.json({
      status: 'success',
      total: pending.length,
      documents: pending,
    });
  } catch (error) {
    console.error('Get pending documents error:', error);
    return res.status(500).json({ error: 'Failed to load pending documents' });
  }
};

/**
 * API 3: POST /api/v1/anchor
 * Body JSON: { original_hash, signature, nonce?, deadline?, tenant_id?, doc_type?, version?, cid?, ciphertext_hash?, encryption_meta_hash? }
 * - signature: chữ ký ủy quyền từ UI/user (bắt buộc).
 * - Backend luôn tự ký on-chain bằng BACKEND_OPERATOR_PRIVATE_KEY để trả gas.
 */
const anchorDocument = async (req, res) => {
  try {
    const {
      original_hash: originalHash,
      signature,
      nonce: overrideNonce,
      deadline: overrideDeadline,
      tenant_id: overrideTenantId,
      doc_type: overrideDocType,
      version: overrideVersion,
      cid: overrideCid,
      ciphertext_hash: overrideCiphertextHash,
      encryption_meta_hash: overrideEncryptionMetaHash,
    } = req.body || {};
    if (!originalHash || !signature) {
      return res.status(400).json({ error: 'original_hash and signature are required' });
    }

    const issuerCandidates = [...new Set([
      (req.walletAddress || '').toLowerCase(),
      req.apiClient?.client_id ? `client:${req.apiClient.client_id}`.toLowerCase() : null,
    ].filter(Boolean))];

    const doc = await EncryptedDocument.findOne({
      original_hash: originalHash,
      issuer_address: { $in: issuerCandidates },
    });
    if (!doc) {
      return res.status(404).json({ error: 'Draft document not found' });
    }

    if (doc.status === 'ANCHORED') {
      return res.status(409).json({
        error: 'Document already anchored',
        original_hash: originalHash,
        tx_hash: doc.tx_hash,
      });
    }

    const tenantId = overrideTenantId || doc.tenant_id;
    const docType = Number(overrideDocType ?? doc.doc_type ?? 0);
    const version = Number(overrideVersion ?? doc.version ?? 1);
    const nonce = overrideNonce ?? doc.operator_nonce;
    const deadline = overrideDeadline ?? doc.deadline;
    const cid = overrideCid || doc.metadata_cid;
    const ciphertextHash = overrideCiphertextHash || doc.hashes?.ciphertext_hash || ethers.ZeroHash;
    const encryptionMetaHash = overrideEncryptionMetaHash || doc.hashes?.encryption_meta_hash || ethers.ZeroHash;

    if (!tenantId || nonce === null || nonce === undefined || deadline === null || deadline === undefined) {
      return res.status(400).json({
        error: 'Draft/request is missing tenant_id/operator_nonce/deadline for blockchain anchoring',
      });
    }

    const expectedUserSigner = req.headers['x-wallet-address'];
    const userAuthorizationPayload = {
      tenantId,
      fileHash: doc.original_hash,
      cid,
      ciphertextHash,
      encryptionMetaHash,
      docType,
      version,
      nonce: String(nonce),
      deadline: String(deadline),
    };
    const authorizedSigner = await blockchainService.verifyClientAuthorizationSignature(
      userAuthorizationPayload,
      signature,
      expectedUserSigner
    );

    const cidsToPin = [...new Set([
      doc.file_cid,
      cid,
      doc.metadata_cid,
      doc.directory_cid,
    ].filter(Boolean))];

    const pinResultsByCid = {};
    for (const pinCid of cidsToPin) {
      pinResultsByCid[pinCid] = await ipfsService.pinOnAllNodes(pinCid, { strict: true });
    }

    const anchorResult = await blockchainService.anchorDocument(
      {
        tenantId,
        fileHash: doc.original_hash,
        cid,
        ciphertextHash,
        encryptionMetaHash,
        docType,
        version,
        nonce: String(nonce),
        deadline: String(deadline),
      },
      null
    );

    doc.tenant_id = tenantId;
    doc.doc_type = docType;
    doc.version = version;
    doc.operator_nonce = String(anchorResult.usedNonce || nonce);
    doc.deadline = String(deadline);
    doc.metadata_cid = cid;
    doc.hashes = {
      ...(doc.hashes || {}),
      ciphertext_hash: ciphertextHash,
      encryption_meta_hash: encryptionMetaHash,
    };
    doc.status = 'ANCHORED';
    doc.tx_hash = anchorResult.txHash;
    doc.anchor_error = null;
    doc.anchored_at = new Date();
    await doc.save();

    activityService.log({
      action: 'anchor_document',
      userId: null,
      resourceType: 'encrypted_document',
      resourceId: originalHash,
      metadata: {
        tx_hash: anchorResult.txHash,
        metadata_cid: doc.metadata_cid,
        pin_report: pinResultsByCid,
        wallet: req.walletAddress,
        authorized_signer: authorizedSigner,
        onchain_signature_source: anchorResult.signatureSource,
        onchain_operator: anchorResult.operatorAddress,
      },
    }, req);

    return res.json({
      status: 'success',
      document: {
        original_hash: doc.original_hash,
        cid: doc.metadata_cid,
        metadata_cid: doc.metadata_cid,
        directory_cid: doc.directory_cid,
        draft_status: doc.status,
        tx_hash: doc.tx_hash,
        anchored_at: doc.anchored_at,
        pin_report: pinResultsByCid,
      },
    });
  } catch (error) {
    console.error('Anchor document error:', error);

    if (req.body?.original_hash) {
      await EncryptedDocument.updateOne(
        {
          original_hash: req.body.original_hash,
          issuer_address: {
            $in: [...new Set([
              (req.walletAddress || '').toLowerCase(),
              req.apiClient?.client_id ? `client:${req.apiClient.client_id}`.toLowerCase() : null,
            ].filter(Boolean))],
          },
        },
        { $set: { status: 'FAILED', anchor_error: error.message } }
      );
    }

    return res.status(500).json({ error: 'Anchoring failed', detail: error.message });
  }
};

/**
 * Utility endpoint: stream encrypted file từ MinIO cache.
 */
const serveBinary = async (req, res) => {
  try {
    const { hash } = req.params;

    const doc = await EncryptedDocument.findOne({ original_hash: hash });
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Length': doc.file_size,
      'X-Original-Hash': doc.original_hash,
      'X-IPFS-File-CID': doc.file_cid,
      'X-IPFS-Metadata-CID': doc.metadata_cid,
      'X-IPFS-Directory-CID': doc.directory_cid || '',
    });

    const stream = await minioService.getObjectStream(doc.minio_object_key);
    stream.pipe(res);
  } catch (error) {
    console.error('Serve binary error:', error);
    return res.status(500).json({ error: 'Failed to retrieve binary' });
  }
};

/**
 * Utility endpoint: trạng thái tài liệu theo original_hash.
 */
const getDocumentStatus = async (req, res) => {
  try {
    const { hash } = req.params;

    const doc = await EncryptedDocument.findOne({ original_hash: hash });
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    return res.json({
      original_hash: doc.original_hash,
      file_name: doc.file_name,
      status: doc.status,
      cid: doc.metadata_cid,
      file_cid: doc.file_cid,
      metadata_cid: doc.metadata_cid,
      directory_cid: doc.directory_cid,
      tx_hash: doc.tx_hash,
      tenant_id: doc.tenant_id,
      created_at: doc.createdAt,
      anchored_at: doc.anchored_at,
    });
  } catch (error) {
    console.error('Status error:', error);
    return res.status(500).json({ error: 'Failed to get document status' });
  }
};

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
  uploadDraft,
  getPendingDocuments,
  anchorDocument,
  serveBinary,
  getDocumentStatus,
  getOperatorNonce,
};
