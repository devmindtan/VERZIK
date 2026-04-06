const { ethers } = require('ethers');
const { protocolContract, provider } = require('../config/blockchain');

const ERROR_HINTS = {
  TenantNotFound: 'tenant_id chưa tồn tại trên contract',
  TenantInactive: 'tenant đang bị inactive',
  OperatorNotInTenant: 'signer chưa join operator trong tenant này',
  OperatorNotActive: 'operator đã join nhưng đang inactive',
  InvalidSignature: 'signature sai hoặc nonce trong payload không khớp nonce on-chain',
  ExpiredSignature: 'signature đã hết hạn (deadline quá thời gian hiện tại)',
  DocumentAlreadyExists: 'fileHash đã được anchor trước đó trong tenant',
};

const REGISTER_TYPES = {
  Register: [
    { name: 'tenantId', type: 'bytes32' },
    { name: 'fileHash', type: 'bytes32' },
    { name: 'cid', type: 'string' },
    { name: 'ciphertextHash', type: 'bytes32' },
    { name: 'encryptionMetaHash', type: 'bytes32' },
    { name: 'docType', type: 'uint32' },
    { name: 'version', type: 'uint32' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
};

const getRegisterDomain = async () => {
  const network = await provider.getNetwork();
  return {
    name: 'VoucherProtocol',
    version: '1',
    chainId: Number(network.chainId),
    verifyingContract: String(protocolContract.target),
  };
};

const getBackendOperatorWallet = () => {
  const privateKey = (process.env.BACKEND_OPERATOR_PRIVATE_KEY || process.env.OPERATOR_PRIVATE_KEY || '').trim();
  if (!privateKey) {
    throw new Error('BACKEND_OPERATOR_PRIVATE_KEY is not configured');
  }
  return new ethers.Wallet(privateKey);
};

const signRegisterPayloadByBackendOperator = async (payload) => {
  const wallet = getBackendOperatorWallet();
  const domain = await getRegisterDomain();
  return wallet.signTypedData(domain, REGISTER_TYPES, payload);
};

const verifyClientAuthorizationSignature = async (payload, signature, expectedSignerAddress) => {
  const domain = await getRegisterDomain();
  let recovered;
  try {
    recovered = ethers.verifyTypedData(domain, REGISTER_TYPES, payload, signature);
  } catch {
    throw new Error('Client signature is invalid');
  }

  if (expectedSignerAddress && ethers.isAddress(expectedSignerAddress)) {
    if (recovered.toLowerCase() !== expectedSignerAddress.toLowerCase()) {
      throw new Error(`Client signer mismatch: recovered=${recovered} expected=${expectedSignerAddress}`);
    }
  }

  return recovered.toLowerCase();
};

const getRevertData = (error) => {
  return (
    error?.revert?.data
    || error?.data
    || error?.info?.error?.data?.data
    || error?.info?.error?.data
    || error?.error?.data
    || null
  );
};

const decodeContractError = (error) => {
  const revertData = getRevertData(error);
  if (!revertData || typeof revertData !== 'string') return null;

  try {
    const parsed = protocolContract.interface.parseError(revertData);
    if (!parsed) return null;

    const args = (parsed.args || []).map((arg) => (typeof arg === 'bigint' ? arg.toString() : String(arg)));
    return {
      name: parsed.name,
      args,
      hint: ERROR_HINTS[parsed.name] || null,
    };
  } catch {
    return null;
  }
};

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
 * @param {string} payload.cid - IPFS CID (CIDv1)
 * @param {string} payload.ciphertextHash - bytes32
 * @param {string} payload.encryptionMetaHash - bytes32
 * @param {number} payload.docType - uint32
 * @param {number} payload.version - uint32
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

  let signatureToUse = signature;
  let signatureSource = 'client';
  let operatorAddress = null;

  if (!signatureToUse) {
    const operatorWallet = getBackendOperatorWallet();
    operatorAddress = operatorWallet.address.toLowerCase();
    const onChainNonce = await protocolContract.nonces(registerPayload.tenantId, operatorWallet.address);
    registerPayload.nonce = onChainNonce.toString();
    signatureToUse = await signRegisterPayloadByBackendOperator(registerPayload);
    signatureSource = 'backend';
  }

  let tx;
  let receipt;
  try {
    tx = await protocolContract.registerWithSignature(registerPayload, signatureToUse);
    receipt = await tx.wait();
  } catch (error) {
    const decoded = decodeContractError(error);
    if (decoded) {
      const argsSuffix = decoded.args.length ? ` | args=${decoded.args.join(',')}` : '';
      const hintSuffix = decoded.hint ? ` | hint=${decoded.hint}` : '';
      throw new Error(`Smart contract revert: ${decoded.name}${argsSuffix}${hintSuffix}`);
    }
    throw error;
  }

  return {
    txHash: receipt.hash,
    blockNumber: Number(receipt.blockNumber),
    gasUsed: Number(receipt.gasUsed),
    usedNonce: String(registerPayload.nonce),
    signatureSource,
    operatorAddress,
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
  signRegisterPayloadByBackendOperator,
  verifyClientAuthorizationSignature,
};
