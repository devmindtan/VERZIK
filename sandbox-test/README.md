## Dùng để test sdk

> Muốn test thì nhớ sau khi `npm i` thì

```bash
npm link # Ở bên sdk trước

npm link @verzik/sdk #Ngay tại đây

# Sau đó
npx tsx <file>.ts
```

```json
Chọn: 16
🔹 Nhập Transaction Hash (bytes32): 0x536a69930c0b21b34a8f4e9135ccf57f368278932abad650986a6737a695b810
{
  "transaction": {
    "_type": "TransactionResponse",
    "accessList": [],
    "blockNumber": 72,
    "blockHash": "0xb246ad3417f94d085c0863f10a78fbfd97006c2d3a15dba14521fbd3ec4acf3e",
    "blobVersionedHashes": null,
    "chainId": "31337",
    "data": "0xa60f4c0987eaf6415498b3d8bbfdef7710ad54dbc4ff295ee5fc560fe3c290b89754dd5a00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000003",
    "from": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "gasLimit": "119109",
    "gasPrice": "1000109152",
    "hash": "0x536a69930c0b21b34a8f4e9135ccf57f368278932abad650986a6737a695b810",
    "maxFeePerGas": "1000249452",
    "maxPriorityFeePerGas": "1000000000",
    "maxFeePerBlobGas": null,
    "nonce": 1,
    "signature": {
      "_type": "signature",
      "networkV": null,
      "r": "0x0b31f40d38ab6764b2b14c772abda3a4eed270306de8c25b58358f6718485ef1",
      "s": "0x786eed43d0fddd07fd674b98b4302c1c72e0fdaf9d02f7cef2bf234b020bfd73",
      "v": 27
    },
    "to": "0x9d4454B023096f34B160D6B654540c56A1F81688",
    "index": 0,
    "type": 2,
    "value": "0"
  },
  "receipt": {
    "_type": "TransactionReceipt",
    "blockHash": "0xb246ad3417f94d085c0863f10a78fbfd97006c2d3a15dba14521fbd3ec4acf3e",
    "blockNumber": 72,
    "contractAddress": null,
    "cumulativeGasUsed": "119109",
    "from": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "gasPrice": "1000109152",
    "blobGasUsed": null,
    "blobGasPrice": null,
    "gasUsed": "119109",
    "hash": "0x536a69930c0b21b34a8f4e9135ccf57f368278932abad650986a6737a695b810",
    "index": 0,
    "logs": [
      {
        "_type": "log",
        "address": "0x9d4454B023096f34B160D6B654540c56A1F81688",
        "blockHash": "0xb246ad3417f94d085c0863f10a78fbfd97006c2d3a15dba14521fbd3ec4acf3e",
        "blockNumber": 72,
        "data": "0x0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000003",
        "index": 0,
        "topics": [
          "0xf0a24041e06d08c0414775769d1f217c906f14d760e3f298d16d2c64b2672d90",
          "0x87eaf6415498b3d8bbfdef7710ad54dbc4ff295ee5fc560fe3c290b89754dd5a",
          "0x0000000000000000000000000000000000000000000000000000000000000001"
        ],
        "transactionHash": "0x536a69930c0b21b34a8f4e9135ccf57f368278932abad650986a6737a695b810",
        "transactionIndex": 0
      }
    ],
    "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000100000000000200000000000000000000000000000000000000000000800040000000000000000000000000000000000000000000000040000000000001000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080000000000000000000000010000000000000000008000000000000000000000000000000000040000000000000000000000000000000000000000400000000000000000000000000",
    "status": 1,
    "to": "0x9d4454B023096f34B160D6B654540c56A1F81688"
  },
  "block": {
    "_type": "Block",
    "baseFeePerGas": "109152",
    "difficulty": "0",
    "extraData": "0x",
    "gasLimit": "60000000",
    "gasUsed": "119109",
    "blobGasUsed": "0",
    "excessBlobGas": "0",
    "hash": "0xb246ad3417f94d085c0863f10a78fbfd97006c2d3a15dba14521fbd3ec4acf3e",
    "miner": "0xC014BA5EC014ba5ec014Ba5EC014ba5Ec014bA5E",
    "prevRandao": "0x515723972fac919a7dc80101b6325b1c5e4f988a6e171b868dbcf2180116826a",
    "nonce": "0x0000000000000000",
    "number": 72,
    "parentHash": "0x05af138a075041c04ab93cc0b9fca41df71721c4c23eb14b2334b4cb72fb7178",
    "timestamp": 1775909882,
    "parentBeaconBlockRoot": "0x2345abc39aeb8099decabe476808ee586493eab6ce168488113e964a24b05e23",
    "stateRoot": "0x4d0e5a40010e0b1a62619e35e07dc89c63b65be3e82bb2c59e753485979e0f7a",
    "receiptsRoot": "0x2694ec0b8d863b40262d8838969f5d3972bca9dab9bcc693bed32f33e99ec795",
    "transactions": [
      "0x536a69930c0b21b34a8f4e9135ccf57f368278932abad650986a6737a695b810"
    ]
  },
  "confirmations": 11,
  "decodedInput": {
    "fragment": {
      "type": "function",
      "inputs": [
        {
          "name": "tenantId",
          "type": "bytes32",
          "baseType": "bytes32",
          "components": null,
          "arrayLength": null,
          "arrayChildren": null
        },
        {
          "name": "docType",
          "type": "uint32",
          "baseType": "uint32",
          "components": null,
          "arrayLength": null,
          "arrayChildren": null
        },
        {
          "name": "enabled",
          "type": "bool",
          "baseType": "bool",
          "components": null,
          "arrayLength": null,
          "arrayChildren": null
        },
        {
          "name": "minStake",
          "type": "uint256",
          "baseType": "uint256",
          "components": null,
          "arrayLength": null,
          "arrayChildren": null
        },
        {
          "name": "minSigners",
          "type": "uint256",
          "baseType": "uint256",
          "components": null,
          "arrayLength": null,
          "arrayChildren": null
        },
        {
          "name": "requiredRoleMask",
          "type": "uint256",
          "baseType": "uint256",
          "components": null,
          "arrayLength": null,
          "arrayChildren": null
        }
      ],
      "name": "setCoSignPolicy",
      "constant": false,
      "outputs": [],
      "stateMutability": "nonpayable",
      "payable": false,
      "gas": null
    },
    "name": "setCoSignPolicy",
    "args": [
      "0x87eaf6415498b3d8bbfdef7710ad54dbc4ff295ee5fc560fe3c290b89754dd5a",
      "1",
      true,
      "1",
      "3",
      "3"
    ],
    "signature": "setCoSignPolicy(bytes32,uint32,bool,uint256,uint256,uint256)",
    "selector": "0xa60f4c09",
    "value": "0"
  },
  "decodedLogs": [
    {
      "name": "CoSignPolicyUpdated",
      "signature": "CoSignPolicyUpdated(bytes32,uint32,bool,uint256,uint256,uint256)",
      "args": {
        "tenantId": "0x87eaf6415498b3d8bbfdef7710ad54dbc4ff295ee5fc560fe3c290b89754dd5a",
        "docType": "1",
        "enabled": true,
        "minStake": "1",
        "minSigners": "3",
        "requiredRoleMask": "3"
      }
    }
  ]
}

```
