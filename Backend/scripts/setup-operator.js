/**
 * Setup/check operator for VoucherProtocol tenant.
 *
 * Usage:
 *   node scripts/setup-operator.js
 *
 * Required env:
 *   TENANT_ID
 *   OPERATOR_PRIVATE_KEY (or BACKEND_OPERATOR_PRIVATE_KEY or PRIVATE_KEY)
 *
 * Optional env:
 *   BLOCKCHAIN_RPC_URL (default: http://100.114.63.52:30545)
 *   PROTOCOL_ADDRESS (default: 0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6)
 *   OPERATOR_METADATA_URI (default: ipfs://operator/local)
 *   OPERATOR_STAKE_ETH (if set, must be >= tenantMinOperatorStake)
 */
require('dotenv').config();
const { ethers } = require('ethers');

const ABI = [
  'function getTenantInfo(bytes32 tenantId) view returns (bool exists, address admin, address treasury, bool isActive, uint256 createdAt)',
  'function tenantMinOperatorStake(bytes32 tenantId) view returns (uint256)',
  'function operators(bytes32 tenantId, address operator) view returns (bytes32 tenantId, string metadataURI, uint256 stakeAmount, bool isActive)',
  'function nonces(bytes32 tenantId, address operator) view returns (uint256)',
  'function joinAsOperator(bytes32 tenantId, string _metadataURI) payable',
];

const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

const run = async () => {
  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || process.env.RPC_URL || 'http://100.114.63.52:30545';
  const protocolAddress = process.env.PROTOCOL_ADDRESS || '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6';
  const tenantId = (process.env.TENANT_ID || '').trim();
  const operatorPrivateKey = (
    process.env.OPERATOR_PRIVATE_KEY
    || process.env.BACKEND_OPERATOR_PRIVATE_KEY
    || process.env.PRIVATE_KEY
    || ''
  ).trim();
  const metadataURI = (process.env.OPERATOR_METADATA_URI || 'ipfs://operator/local').trim();
  const stakeEth = (process.env.OPERATOR_STAKE_ETH || '').trim();

  if (!tenantId) {
    throw new Error('Missing TENANT_ID');
  }
  if (!ethers.isHexString(tenantId, 32)) {
    throw new Error('TENANT_ID must be bytes32 hex');
  }
  if (!operatorPrivateKey) {
    throw new Error('Missing OPERATOR_PRIVATE_KEY (or BACKEND_OPERATOR_PRIVATE_KEY or PRIVATE_KEY)');
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(operatorPrivateKey, provider);
  const contract = new ethers.Contract(protocolAddress, ABI, wallet);
  const network = await provider.getNetwork();

  console.log('=== Setup Operator ===');
  console.log('RPC       :', rpcUrl);
  console.log('Chain ID  :', Number(network.chainId));
  console.log('Protocol  :', protocolAddress);
  console.log('Tenant ID :', tenantId);
  console.log('Operator  :', wallet.address);

  const tenantInfo = await contract.getTenantInfo(tenantId);
  if (!tenantInfo.exists) {
    throw new Error('Tenant does not exist on-chain');
  }
  if (!tenantInfo.isActive) {
    throw new Error('Tenant exists but is inactive');
  }

  console.log('\nTenant info');
  console.log('Admin    :', tenantInfo.admin);
  console.log('Treasury :', tenantInfo.treasury);
  console.log('Active   :', tenantInfo.isActive);

  const minStake = await contract.tenantMinOperatorStake(tenantId);
  const operatorBefore = await contract.operators(tenantId, wallet.address);

  const alreadyInTenant = operatorBefore.tenantId && operatorBefore.tenantId !== ZERO_BYTES32;
  console.log('\nOperator before');
  console.log('Joined   :', alreadyInTenant);
  console.log('Active   :', operatorBefore.isActive);
  console.log('Stake    :', ethers.formatEther(operatorBefore.stakeAmount), 'ETH');
  console.log('MinStake :', ethers.formatEther(minStake), 'ETH');

  if (alreadyInTenant && operatorBefore.isActive) {
    const nonce = await contract.nonces(tenantId, wallet.address);
    console.log('\nNo action needed: operator already active in this tenant');
    console.log('Nonce    :', nonce.toString());
    return;
  }

  let valueToSend = minStake;
  if (stakeEth) {
    const desiredStake = ethers.parseEther(stakeEth);
    if (desiredStake < minStake) {
      throw new Error(`OPERATOR_STAKE_ETH too low. Required >= ${ethers.formatEther(minStake)} ETH`);
    }
    valueToSend = desiredStake;
  }

  console.log('\nSubmitting joinAsOperator...');
  console.log('Metadata :', metadataURI);
  console.log('Value    :', ethers.formatEther(valueToSend), 'ETH');

  const tx = await contract.joinAsOperator(tenantId, metadataURI, { value: valueToSend });
  console.log('Tx hash  :', tx.hash);
  const receipt = await tx.wait();
  console.log('Block    :', receipt.blockNumber);

  const operatorAfter = await contract.operators(tenantId, wallet.address);
  const nonce = await contract.nonces(tenantId, wallet.address);

  console.log('\nOperator after');
  console.log('Joined   :', operatorAfter.tenantId !== ZERO_BYTES32);
  console.log('Active   :', operatorAfter.isActive);
  console.log('Stake    :', ethers.formatEther(operatorAfter.stakeAmount), 'ETH');
  console.log('Nonce    :', nonce.toString());
};

run().catch((error) => {
  console.error('\nSetup operator failed:', error.message || error);
  process.exit(1);
});
