## Những thứ cần sửa

### Treasury page

**Các API đang có cùng với giải thích**

```bash
#lấy toàn bộ lịch sử những operator yêu cầu rút tiền cọc
router.get("/operator-unstake-requesteds", handleGetOperatorUnstakeRequesteds);
{
  "success": true,
  "data": [
    {
      "id": "0xca00e106fd865f7a57e703718c6736b3ff7e9f42699be993c34c347d0bd0359f00000000",
      "tenantId": "0x2808a2ff94d77f5fc2638f879e891b89a81a14b77977b25f074faa6e1bd1cad1",
      "operator": "0x71be63f3384f5fb98995898a86b02fb2426c5788",
      "availableAt": "1776603630",
      "blockNumber": "157",
      "blockTimestamp": "1776600399",
      "transactionHash": "0xca00e106fd865f7a57e703718c6736b3ff7e9f42699be993c34c347d0bd0359f"
    }
  ]
}
#lấy toàn bộ lịch sử những operator đã rút tiền cọc sau khi hết thời gian chờ
router.get("/operator-unstakeds", handleGetOperatorUnstakeds);
  operatorUnstakeds {
    amount
    blockNumber
    blockTimestamp
    id
    operator
    tenantId
    transactionHash
  }
#lấy thông tin hiện tại của operator chỗ này không có blocktimestamp nên vẫn lấy timestamp mới nhất ở graph
router.get("/operator-status", handleGetOperatorStatus);
{
  "success": true,
  "data": {
    "exists": true,
    "isActive": true,
    "walletAddress": "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
    "metadataURI": "none",
    "stakeAmount": 0.2,
    "nonce": 2,
    "unstakeReadyAt": 0,
    "canUnstakeNow": false,
    "recoveryDelegate": "0x0000000000000000000000000000000000000000"
  }
}
#lấy minStake và unstakeCooldown đã cấu hình hiện tại theo id
router.get("/tenant-runtime-config", handleGetTenantRuntimeConfig);
{
  "success": true,
  "data": {
    "minOperatorStake": 0.1,
    "unstakeCooldown": 3231
  }
}
#lấy thông tin hiện tại của tenant
router.get("/tenant-info", handleGetTenantInfo);
{
  "success": true,
  "data": {
    "id": "0x2808a2ff94d77f5fc2638f879e891b89a81a14b77977b25f074faa6e1bd1cad1",
    "admin": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "operatorManager": "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    "treasury": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "isActive": true,
    "createdAt": "1776433204"
  }
}
#lấy thông tin hiện tại của document theo id
router.get("/document-status", handleGetDocumentStatus);
{
  "success": true,
  "data": {
    "exists": true,
    "isValid": true,
    "issuer": "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
    "cid": "none",
    "timestamp": "1776500633",
    "ciphertextHash": "0x2808a2ff94d77f5fc2638f879e891b89a81a14b77977b25f074faa6e1bd12345",
    "encryptionMetaHash": "0x2808a2ff94d77f5fc2638f879e891b89a81a14b77977b25f074faa6e1bd12345",
    "docType": "1",
    "version": "1",
    "coSignCount": "3",
    "trustedCoSignCount": "3",
    "trustedCoSignRoleMask": "1",
    "coSignQualified": true
  }
}
```

### Yêu cầu chỉnh sửa

- Tôi đã bổ sung 1 vài api nữa lấy trực tiếp từ hàm view của blockchain và trả về thông tin hiện tại của tenant + tenant runtime config, operator, document
- Lưu ý operator thiếu trường thời gian tạo nên vẫn lấy thời gian mới nhất từ graph
- Còn 2 api operator-unstake-requesteds và operator-unstakeds thì bổ sung vào 2 bảng ở treasury page
- Các api kia thì thay thế cho hiển thị thông tin lấy từ graph, graph chỉ để hiển thị lịch sử giao dịch thôi (nhưng hãy để ý 1 số lưu ý như operator thiếu thời gian tạo thì vẫn lấy)
- Và hãy bổ sung vào những bảng nào chưa có dữ liệu thì hiện là chưa có chứ đừng để trống
