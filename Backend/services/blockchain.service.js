const { protocolContract, provider } = require('../config/blockchain');

/**
 * Lấy nonce hiện tại của operator trong tenant
 */
const getOperatorNonce = async (tenantId, operatorAddress) => {
  const nonce = await protocolContract.nonces(tenantId, operatorAddress);
  return nonce;
};

/**
 * Anchor tài liệu lên smart contract qua registerWithSignature.
 * Backend chỉ là relayer — trả gas.
 * Signature phải từ operator đã active trong tenant.
 *
 * @param {Object} payload - RegisterPayload fields
 * @param {string} payload.tenantId - bytes32
 * @param {string} payload.fileHash - bytes32
 * @param {string} payload.cid - IPFS/MinIO CID
 * @param {string} payload.ciphertextHash - bytes32
 * @param {string} payload.encryptionMetaHash - bytes32
 * @param {number} payload.docType - uint8
 * @param {number} payload.version - uint16
 * @param {string} payload.nonce - uint256
 * @param {string} payload.deadline - uint256
 * @param {string} signature - EIP-712 signature from operator
 * @returns {Object} { txHash, blockNumber }
 */
const anchorDocument = async (payload, signature) => {
  const registerPayload = {
    tenantId: payload.tenantId,
    fileHash: payload.fileHash,
    cid: payload.cid,
    ciphertextHash: payload.ciphertextHash,
    encryptionMetaHash: payload.encryptionMetaHash,
    docType: payload.docType,
    version: payload.version,
    nonce: payload.nonce,
    deadline: payload.deadline,
  };

  const tx = await protocolContract.registerWithSignature(registerPayload, signature);
  const receipt = await tx.wait();

  return {
    txHash: receipt.hash,
    blockNumber: Number(receipt.blockNumber),
    gasUsed: Number(receipt.gasUsed),
  };
};

/**
 * Verify document on-chain
 */
const verifyOnChain = async (tenantId, fileHash) => {
  const [exists, isValid, issuer, cid] = await protocolContract.verify(tenantId, fileHash);
  return { exists, isValid, issuer, cid };
};

module.exports = {
  anchorDocument,
  getOperatorNonce,
  verifyOnChain,
};
