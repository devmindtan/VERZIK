const { ethers } = require('ethers');
require('dotenv').config();

const VOUCHER_PROTOCOL_ABI = [
  'function registerWithSignature((bytes32 tenantId, bytes32 fileHash, string cid, bytes32 ciphertextHash, bytes32 encryptionMetaHash, uint8 docType, uint16 version, uint256 nonce, uint256 deadline) payload, bytes signature) external',
  'function nonces(bytes32 tenantId, address operator) external view returns (uint256)',
  'function verify(bytes32 tenantId, bytes32 fileHash) external view returns (bool exists, bool isValid, address issuer, string cid)',
];

const provider = new ethers.JsonRpcProvider(
  process.env.BLOCKCHAIN_RPC_URL || 'http://100.114.63.52:30545'
);

const relayerWallet = new ethers.Wallet(
  process.env.RELAYER_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  provider
);

const protocolContract = new ethers.Contract(
  process.env.PROTOCOL_ADDRESS || '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
  VOUCHER_PROTOCOL_ABI,
  relayerWallet
);

module.exports = {
  provider,
  relayerWallet,
  protocolContract,
  VOUCHER_PROTOCOL_ABI,
};
