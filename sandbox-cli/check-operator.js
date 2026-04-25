require('dotenv').config();
const { ethers } = require('ethers');

const pk = (process.env.PRIVATE_KEY || process.env.BACKEND_OPERATOR_PRIVATE_KEY || '').trim();
if (!pk) { console.log('No private key found'); process.exit(1); }

const w = new ethers.Wallet(pk);
console.log('Wallet address:', w.address);

const rpcUrl = (process.env.RPC_URL || 'https://hardhat.devmindtan.uk/').trim();
const provider = new ethers.JsonRpcProvider(rpcUrl);

const abi = [
  'function getOperatorStruct(bytes32 tenantId, address operator) view returns (tuple(uint256 stakeAmount, bool isActive, string metadataURI, uint256 joinedAt, uint256 unstakeRequestedAt))',
];
const contractAddress = '0x4631BCAbD6dF18D94796344963cB60d44a4136b6';
const contract = new ethers.Contract(contractAddress, abi, provider);
const tenantId = '0x2808a2ff94d77f5fc2638f879e891b89a81a14b77977b25f074faa6e1bd1cad1';

contract.getOperatorStruct(tenantId, w.address)
  .then(r => {
    console.log('stakeAmount:', r.stakeAmount.toString());
    console.log('isActive:', r.isActive);
    if (r.stakeAmount.toString() === '0') {
      console.log('\n⚠️  Wallet này chưa joinAsOperator trong tenant đó!');
    } else {
      console.log('\n✅ Operator hợp lệ');
    }
  })
  .catch(e => console.log('Error:', e.message));
