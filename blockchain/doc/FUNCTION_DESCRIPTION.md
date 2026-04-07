# Mô tả chức năng cho bộ Smart Contract `VoucherProtocol` + `VoucherProtocolReader`

> Ghi chú đồng bộ: sau khi tối ưu kích thước bytecode, các hàm đọc `view` đã được tách khỏi `VoucherProtocol` sang `VoucherProtocolReader`. Contract `VoucherProtocol` hiện giữ logic ghi/chứng thực nghiệp vụ, còn `VoucherProtocolReader` đảm nhiệm API truy vấn và sử dụng thêm một số getter hỗ trợ ở cuối contract core.

### Danh sách hàm đã mô tả:

1. Constructor - Khởi tạo protocol
2. joinAsOperator - Tuyển dụng operator mới
3. topUpStake - Nạp thêm stake
4. updateOperatorMetadata - Cập nhật hồ sơ
5. requestUnstake - Yêu cầu rút stake
6. executeUnstake - Thực thi rút stake
7. registerWithSignature - Anchor tài liệu với chữ ký EIP-712
8. \_recoverSigner - Recover signer từ payload
9. verify - Tra cứu trạng thái tài liệu (`VoucherProtocolReader`)
10. getDocumentOrRevert - Lấy metadata tài liệu (`VoucherProtocolReader`)
11. revokeDocument - Thu hồi tài liệu
12. setOperatorStatus - Quản lý operator
13. setTreasury - Cập nhật treasury
14. slashOperator - Hard slash (tịch thu 100% stake)
15. setRecoveryDelegate - Thiết lập ví dự phòng khôi phục
16. recoverOperatorByDelegate - Khôi phục ví bị mất bằng delegate đã đăng ký
17. recoverOperatorByAdmin - Khôi phục khẩn cấp bằng governance
18. coSignDocumentWithSignature - Đồng ký tài liệu đã anchor
19. \_recoverCoSigner - Recover signer cho payload đồng ký
20. hasSignedDocument - Kiểm tra 1 địa chỉ đã ký tài liệu chưa (`VoucherProtocolReader`)
21. setCoSignPolicy - Cấu hình chính sách co-sign theo docType
22. setCoSignOperator - Cấu hình whitelist + role co-sign cho operator
23. isDocumentCoSignQualified - Kiểm tra tài liệu đã đạt quorum co-sign chưa (`VoucherProtocolReader`)
24. getCoSignStatus - Tra cứu tiến trình co-sign theo policy (`VoucherProtocolReader`)
25. setMinOperatorStake - Cấu hình stake tối thiểu cho operator tham gia
26. setUnstakeCooldown - Cấu hình thời gian chờ rút stake
27. setViolationPenalty - Cấu hình mức phạt (BPS) theo từng mã vi phạm
28. softSlashOperator - Soft slash theo mức phạt đã cấu hình cho từng lỗi
29. createTenant - Tạo tenant mới với admin/treasury riêng
30. setTenantStatus - Bật/tắt tenant ở tầng protocol
31. getTenantCount - Trả số lượng tenant đã khởi tạo (`VoucherProtocolReader`)
32. \_enforceCoSignPolicy - Kiểm tra tổng hợp điều kiện co-sign cho signer
33. \_evaluateCoSignQualification - Đánh giá và cập nhật cờ qualified cho tài liệu
34. \_roleToMask - Chuyển roleId sang bitmask quorum
35. \_getTenantAdminRole - Sinh role admin động theo tenantId
36. \_getTenantSlasherRole - Sinh role slasher động theo tenantId
37. \_getTenantOperatorManagerRole - Sinh role operator-manager động theo tenantId
38. getTenantIds - Trả danh sách tenantId theo phân trang (`VoucherProtocolReader`)
39. getTenantInfo - Trả trạng thái và thông tin quản trị của tenantId (`VoucherProtocolReader`)
40. getOperatorStatus - Trả snapshot trạng thái operator theo tenant (`VoucherProtocolReader`)
41. getDocumentStatus - Trả snapshot tài liệu + tiến trình co-sign (`VoucherProtocolReader`)
42. getCoSignPolicy - Trả policy co-sign theo tenant và docType (`VoucherProtocolReader`)
43. getCoSignOperatorConfig - Trả whitelist + role co-sign của operator (`VoucherProtocolReader`)
44. getTenantRuntimeConfig - Trả config runtime cốt lõi của tenant (`VoucherProtocolReader`)
45. getViolationPenalty - Trả penalty BPS theo mã vi phạm (`VoucherProtocolReader`)
46. getDocument - Getter hỗ trợ `VoucherProtocolReader`
47. getCoSignPolicyStruct - Getter hỗ trợ `VoucherProtocolReader`
48. getTenantStruct - Getter hỗ trợ `VoucherProtocolReader`
49. getOperatorStruct - Getter hỗ trợ `VoucherProtocolReader`
50. getTenantListLength - Getter hỗ trợ `VoucherProtocolReader`
51. getTenantAtIndex - Getter hỗ trợ `VoucherProtocolReader`

### Mỗi hàm gồm:

- 📌 Mục tiêu (quote ý nghĩa kỹ thuật)
- 💻 Code (đầy đủ logic)
- 📋 Bảng giải thích (thành phần chính + ý nghĩa)
- 🔗 Tham khảo (link tới tài liệu liên quan)

---

## 1. Constructor

> _**Mục tiêu:** Khởi tạo contract ở tầng protocol: xác lập quyền quản trị gốc của hệ thống và domain EIP-712 dùng chung cho mọi tenant._

_Code_

```solidity
constructor() {
    // Gán ví deployer làm protocol owner của toàn hệ thống.
    protocolOwner = msg.sender;
    // Cấp quyền admin gốc cho deployer để còn quản lý role cấp cao.
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    // Cấp role quản trị protocol để deployer có thể tạo tenant mới.
    _grantRole(PROTOCOL_ADMIN_ROLE, msg.sender);

    // Tạo domain separator cho toàn bộ chữ ký typed-data của contract này.
    DOMAIN_SEPARATOR = keccak256(abi.encode(
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
        keccak256("VoucherProtocol"),
        keccak256("1"),
        block.chainid,
        address(this)
    ));

    // Phát event để đánh dấu protocol đã sẵn sàng vận hành.
    emit ProtocolInitialized(msg.sender);
}
```

_Giải thích_

| **Thành phần**          | **Ý nghĩa kỹ thuật**                                                                                     |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| **protocolOwner**       | Deployer trở thành quản trị gốc của contract ở cấp protocol, không phải admin của từng tenant nghiệp vụ. |
| **DEFAULT_ADMIN_ROLE**  | Quyền admin cao nhất để quản lý role hệ thống.                                                           |
| **PROTOCOL_ADMIN_ROLE** | Quyền dành riêng cho việc tạo/bật/tắt tenant ở tầng multi-tenant.                                        |
| **DOMAIN_SEPARATOR**    | Khóa cứng domain EIP-712 cho toàn bộ chữ ký của contract.                                                |
| **block.chainid**       | Ngăn reuse chữ ký giữa các chain khác nhau.                                                              |

---

## 2. joinAsOperator

> _**Mục tiêu:** Tuyển dụng operator mới với ràng buộc kinh tế (stake) và hồ sơ định danh (metadataURI) trong phạm vi một tenant cụ thể._

_Code_

```solidity
function joinAsOperator(bytes32 tenantId, string calldata _metadataURI) external payable {
    // Tenant phải tồn tại trước khi nhận operator mới.
    if (tenants[tenantId].admin == address(0)) revert TenantNotFound();
    // Tenant đang bị vô hiệu thì không cho phép onboarding thêm operator.
    if (!tenants[tenantId].isActive) revert TenantInactive();
    // Stake gửi vào phải đạt ngưỡng tối thiểu của tenant đó.
    if (msg.value < tenantMinOperatorStake[tenantId]) {
        revert InsufficientStake(msg.value, tenantMinOperatorStake[tenantId]);
    }
    // Nếu operator đã có stake hoặc đang active thì không cho join đè.
    if (operators[tenantId][msg.sender].stakeAmount != 0 || operators[tenantId][msg.sender].isActive) {
        revert OperatorAlreadyActive();
    }

    // Ghi toàn bộ hồ sơ operator vào namespace của tenant tương ứng.
    operators[tenantId][msg.sender] = Operator({
        tenantId: tenantId,
        metadataURI: _metadataURI,
        stakeAmount: msg.value,
        isActive: true
    });
    // Reset trạng thái unstake vì operator vừa mới join.
    pendingUnstakeAt[tenantId][msg.sender] = 0;

    // Phát event join để indexer đồng bộ operator mới.
    emit OperatorJoined(tenantId, msg.sender, _metadataURI, msg.value);
    // Phát event trạng thái để audit trail đầy đủ hơn.
    emit OperatorStatusUpdated(tenantId, msg.sender, true, "JOINED");
}
```

_Giải thích_

| **Thành phần**                      | **Ý nghĩa kỹ thuật**                                                              |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| **tenantId**                        | Xác định operator đang gia nhập tenant nào, tránh đụng dữ liệu giữa các tenant.   |
| **tenantMinOperatorStake**          | Mỗi tenant có stake tối thiểu riêng, không còn dùng một cấu hình global duy nhất. |
| **TenantInactive**                  | Tenant bị khóa sẽ không thể tuyển thêm operator mới.                              |
| **operators[tenantId][msg.sender]** | Mọi operator đều được namespace hóa theo tenant.                                  |
| **pendingUnstakeAt = 0**            | Reset cooldown rút stake khi operator vừa join.                                   |

---

## 3. topUpStake

> _**Mục tiêu:** Cho phép operator đang active nạp thêm stake để duy trì economic incentive và tăng độ tin cậy trong tenant của mình._

_Code_

```solidity
function topUpStake(bytes32 tenantId) external payable {
    // Tenant phải tồn tại trước khi cập nhật stake.
    if (tenants[tenantId].admin == address(0)) revert TenantNotFound();
    // Operator phải thuộc tenant thì mới được top-up stake.
    if (operators[tenantId][msg.sender].stakeAmount == 0) revert OperatorNotInTenant();
    // Chỉ operator đang active mới được nạp thêm stake.
    if (!operators[tenantId][msg.sender].isActive) revert OperatorNotActive();
    // Giao dịch phải thực sự gửi ETH vào.
    if (msg.value == 0) revert NoStake();

    // Cộng dồn stake mới vào stake hiện có.
    operators[tenantId][msg.sender].stakeAmount += msg.value;

    // Phát event ghi nhận top-up stake thành công.
    emit OperatorStakeToppedUp(
        tenantId,
        msg.sender,
        msg.value,
        operators[tenantId][msg.sender].stakeAmount
    );
}
```

_Giải thích_

| **Thành phần**               | **Ý nghĩa kỹ thuật**                                        |
| ---------------------------- | ----------------------------------------------------------- |
| **OperatorNotInTenant**      | Chặn việc top-up cho một địa chỉ chưa từng join tenant này. |
| **OperatorNotActive**        | Chỉ operator đang hoạt động mới được tăng stake.            |
| **msg.value > 0**            | Tránh transaction vô nghĩa.                                 |
| **stakeAmount += msg.value** | Stake vẫn cộng dồn như logic cũ, nhưng ở phạm vi tenant.    |

---

## 4. updateOperatorMetadata

> _**Mục tiêu:** Cho phép operator cập nhật thông tin hồ sơ khi hành chính thay đổi (mã số thuế, địa chỉ, v.v.) trong tenant tương ứng._

_Code_

```solidity
function updateOperatorMetadata(bytes32 tenantId, string calldata metadataURI) external {
    // Tenant phải tồn tại trước khi cho cập nhật metadata.
    if (tenants[tenantId].admin == address(0)) revert TenantNotFound();
    // Chỉ operator đang active mới có thể tự cập nhật hồ sơ.
    if (!operators[tenantId][msg.sender].isActive) revert OperatorNotActive();

    // Ghi metadata URI mới vào hồ sơ operator.
    operators[tenantId][msg.sender].metadataURI = metadataURI;

    // Phát event để indexer cập nhật profile operator.
    emit OperatorMetadataUpdated(tenantId, msg.sender, metadataURI);
}
```

_Giải thích_

| **Thành phần**              | **Ý nghĩa kỹ thuật**                                            |
| --------------------------- | --------------------------------------------------------------- |
| **tenantId**                | Metadata gắn với operator trong đúng tenant, không phải global. |
| **OperatorNotActive**       | Operator đã bị slash/inactive không được cập nhật hồ sơ.        |
| **OperatorMetadataUpdated** | Event chứa cả `tenantId` để indexer tách lịch sử theo tenant.   |

---

## 5. requestUnstake

> _**Mục tiêu:** Tạo yêu cầu rút stake với cooldown bắt buộc để ngăn manipulate hoặc rút quỹ tức thời, trong tenant tương ứng._

_Code_

```solidity
function requestUnstake(bytes32 tenantId) external {
    // Tenant phải tồn tại trước khi request unstake.
    if (tenants[tenantId].admin == address(0)) revert TenantNotFound();
    // Operator phải đang active để yêu cầu rút stake.
    if (!operators[tenantId][msg.sender].isActive) revert OperatorNotActive();
    // Operator phải còn stake thì request mới có ý nghĩa.
    if (operators[tenantId][msg.sender].stakeAmount == 0) revert NoStake();

    // Tính thời điểm được phép rút dựa trên cooldown của tenant.
    uint256 availableAt = block.timestamp + tenantUnstakeCooldown[tenantId];
    // Lưu mốc thời gian unlock cho operator này.
    pendingUnstakeAt[tenantId][msg.sender] = availableAt;

    // Phát event để theo dõi tiến trình unstake.
    emit OperatorUnstakeRequested(tenantId, msg.sender, availableAt);
}
```

_Giải thích_

| **Thành phần**                             | **Ý nghĩa kỹ thuật**                                |
| ------------------------------------------ | --------------------------------------------------- |
| **tenantUnstakeCooldown**                  | Cooldown giờ do từng tenant tự cấu hình.            |
| **pendingUnstakeAt[tenantId][msg.sender]** | Lưu trạng thái chờ rút stake theo namespace tenant. |
| **availableAt**                            | Mốc thời gian cụ thể để `executeUnstake` kiểm tra.  |

---

## 6. executeUnstake

> _**Mục tiêu:** Hoàn tất rút stake sau cooldown, transfer ETH an toàn về operator trong tenant tương ứng._

_Code_

```solidity
function executeUnstake(bytes32 tenantId) external nonReentrant {
    // Lấy thời điểm unlock của operator trong tenant tương ứng.
    uint256 readyAt = pendingUnstakeAt[tenantId][msg.sender];
    // Nếu chưa từng request unstake thì từ chối.
    if (readyAt == 0) revert NoPendingUnstake();
    // Nếu chưa hết cooldown thì từ chối.
    if (block.timestamp < readyAt) revert UnstakeNotReady(readyAt);

    // Lấy stake hiện tại để chuẩn bị hoàn trả cho operator.
    uint256 amount = operators[tenantId][msg.sender].stakeAmount;
    // Nếu stake bằng 0 thì không có gì để rút.
    if (amount == 0) revert NoStake();

    // Reset stake về 0 trước khi chuyển ETH để giảm rủi ro re-entrancy.
    operators[tenantId][msg.sender].stakeAmount = 0;
    // Đánh dấu operator inactive sau khi rút toàn bộ stake.
    operators[tenantId][msg.sender].isActive = false;
    // Xoá trạng thái pending unstake để kết thúc vòng đời request.
    pendingUnstakeAt[tenantId][msg.sender] = 0;

    // Chuyển ETH về lại cho operator bằng low-level call.
    (bool sent, ) = payable(msg.sender).call{value: amount}("");
    // Nếu chuyển ETH thất bại thì revert toàn bộ giao dịch.
    if (!sent) revert EthTransferFailed();

    // Phát event để ghi nhận việc unstake thành công.
    emit OperatorUnstaked(tenantId, msg.sender, amount);
    // Phát event trạng thái để audit trail đầy đủ.
    emit OperatorStatusUpdated(tenantId, msg.sender, false, "UNSTAKED");
}
```

_Giải thích_

| **Thành phần**                  | **Ý nghĩa kỹ thuật**                                     |
| ------------------------------- | -------------------------------------------------------- |
| **nonReentrant**                | Guard chống re-entrancy khi chuyển tiền.                 |
| **Reset state before transfer** | Áp dụng CEI để ngăn double-spending.                     |
| **low-level call**              | Hoàn trả ETH linh hoạt hơn `transfer`.                   |
| **tenantId**                    | Toàn bộ luồng unstake chạy trong state riêng của tenant. |

---

## 7. registerWithSignature

> _**Mục tiêu:** Anchor bằng chứng tài liệu mã hoá lên blockchain qua chữ ký off-chain xác thực theo EIP-712 trong phạm vi tenant._

_Code_

```solidity
function registerWithSignature(
    RegisterPayload calldata payload,
    bytes calldata signature
) external nonReentrant {
    // Tenant phải tồn tại thì mới cho anchor tài liệu.
    if (tenants[payload.tenantId].admin == address(0)) revert TenantNotFound();
    // Tenant đang inactive thì không cho ghi tài liệu mới.
    if (!tenants[payload.tenantId].isActive) revert TenantInactive();
    // Chữ ký quá hạn thì từ chối xử lý.
    if (block.timestamp > payload.deadline) revert ExpiredSignature();
    // Không cho anchor đè lên tài liệu đã tồn tại trong cùng tenant.
    if (documents[payload.tenantId][payload.fileHash].issuer != address(0)) revert DocumentAlreadyExists();

    // Recover signer thực sự từ payload và chữ ký.
    address signer = _recoverSigner(payload, signature);
    // Signer phải là operator đã đăng ký trong tenant.
    if (operators[payload.tenantId][signer].stakeAmount == 0) revert OperatorNotInTenant();
    // Signer phải đang active mới được anchor tài liệu.
    if (!operators[payload.tenantId][signer].isActive) revert OperatorNotActive();
    // Nonce phải khớp hoàn toàn để ngăn replay attack.
    if (nonces[payload.tenantId][signer] != payload.nonce) revert InvalidSignature();

    // Lưu bản ghi tài liệu đầy đủ vào namespace của tenant.
    documents[payload.tenantId][payload.fileHash] = Document({
        tenantId: payload.tenantId,
        cid: payload.cid,
        issuer: signer,
        timestamp: block.timestamp,
        isValid: true,
        ciphertextHash: payload.ciphertextHash,
        encryptionMetaHash: payload.encryptionMetaHash,
        docType: payload.docType,
        version: payload.version
    });

    // Đánh dấu signer đầu tiên đã ký tài liệu này.
    documentSigners[payload.tenantId][payload.fileHash][signer] = true;
    // Khởi tạo tổng số signer ban đầu là 1.
    coSignCount[payload.tenantId][payload.fileHash] = 1;

    // Nạp policy co-sign tương ứng với docType trong tenant này.
    CoSignPolicy memory policy = tenantCoSignPolicies[payload.tenantId][payload.docType];
    // Nếu policy đang tắt thì tài liệu mặc định đã qualified.
    if (!policy.enabled) {
        coSignQualified[payload.tenantId][payload.fileHash] = true;
    } else {
        // Nếu signer nằm trong whitelist và đạt stake tối thiểu thì được xét trusted.
        if (
            tenantCoSignWhitelisted[payload.tenantId][payload.docType][signer]
                && operators[payload.tenantId][signer].stakeAmount >= policy.minStake
        ) {
            // Lấy role của signer trong docType tương ứng.
            uint16 roleId = tenantCoSignRoles[payload.tenantId][payload.docType][signer];
            // Chỉ role hợp lệ mới được tính vào quorum trusted.
            if (roleId >= MIN_COSIGN_ROLE_ID && roleId <= MAX_COSIGN_ROLE_ID) {
                // Ghi nhận signer trusted đầu tiên cho tài liệu.
                trustedCoSignCount[payload.tenantId][payload.fileHash] = 1;
                // Chuyển role đầu tiên thành bitmask để theo dõi quorum.
                trustedCoSignRoleMask[payload.tenantId][payload.fileHash] = _roleToMask(roleId);
                // Đánh giá xem tài liệu đã đạt qualified ngay từ issuer hay chưa.
                _evaluateCoSignQualification(payload.tenantId, payload.fileHash, payload.docType);
            }
        }
    }

    // Tăng nonce của signer sau khi ghi nhận anchor thành công.
    nonces[payload.tenantId][signer] = payload.nonce + 1;

    // Phát event nonce để theo dõi replay-protection state.
    emit NonceConsumed(payload.tenantId, signer, payload.nonce, payload.nonce + 1);
    // Phát event anchor tài liệu cho indexer/subgraph.
    emit DocumentAnchored(
        payload.tenantId,
        payload.fileHash,
        payload.cid,
        signer,
        payload.ciphertextHash,
        payload.encryptionMetaHash,
        payload.docType,
        payload.version
    );
    // Phát event đồng ký đầu tiên của issuer.
    emit DocumentCoSigned(payload.tenantId, payload.fileHash, signer, 1);
}
```

_Giải thích_

| **Thành phần**                    | **Ý nghĩa kỹ thuật**                                                          |
| --------------------------------- | ----------------------------------------------------------------------------- |
| **RegisterPayload.tenantId**      | Tài liệu được anchor trong đúng namespace tenant.                             |
| **documents[tenantId][fileHash]** | Một `fileHash` có thể tồn tại độc lập ở nhiều tenant mà không đè nhau.        |
| **nonces[tenantId][signer]**      | Nonce giờ không còn global, mà tách theo tenant để chống replay đúng phạm vi. |
| **co-sign bootstrap**             | Issuer đầu tiên vẫn được tính là signer đầu tiên của tài liệu.                |
| **tenantCoSignPolicies**          | Chính sách co-sign giờ do từng tenant quản lý riêng.                          |

---

## 8. \_recoverSigner

> _**Mục tiêu:** Khôi phục địa chỉ signer từ payload + chữ ký theo chuẩn EIP-712 để xác thực nguồn gốc trong đúng tenant._

_Code_

```solidity
function _recoverSigner(RegisterPayload calldata payload, bytes calldata signature)
    internal
    view
    returns (address signer)
{
    // Băm payload theo schema REGISTER_TYPEHASH đã cố định.
    bytes32 structHash = keccak256(abi.encode(
        REGISTER_TYPEHASH,
        payload.tenantId,
        payload.fileHash,
        keccak256(bytes(payload.cid)),
        payload.ciphertextHash,
        payload.encryptionMetaHash,
        payload.docType,
        payload.version,
        payload.nonce,
        payload.deadline
    ));

    // Kết hợp domain separator với structHash để tạo typed-data digest.
    bytes32 digest = MessageHashUtils.toTypedDataHash(DOMAIN_SEPARATOR, structHash);
    // Recover địa chỉ signer từ digest và chữ ký ECDSA.
    signer = digest.recover(signature);
    // Nếu recover ra zero address thì xem là chữ ký không hợp lệ.
    if (signer == address(0)) revert InvalidSignature();
}
```

_Giải thích_

| **Thành phần**            | **Ý nghĩa kỹ thuật**                                                 |
| ------------------------- | -------------------------------------------------------------------- |
| **REGISTER_TYPEHASH**     | Schema ký đã bổ sung `tenantId` để ràng buộc chữ ký vào đúng tenant. |
| **tenantId trong digest** | Ngăn việc reuse cùng một payload sang tenant khác.                   |
| **toTypedDataHash**       | Giữ nguyên chuẩn an toàn EIP-712.                                    |
| **InvalidSignature**      | Revert cứng khi recover thất bại.                                    |

---

## 9. verify

> _**Mục tiêu:** Tra cứu công khai trạng thái hợp lệ của tài liệu với cờ tồn tại rõ ràng trong phạm vi tenant. Hàm này hiện nằm trong `VoucherProtocolReader`._

_Code_

```solidity
function verify(bytes32 tenantId, bytes32 fileHash)
    external
    view
    returns (bool exists, bool isValid, address issuer, string memory cid)
{
    VoucherProtocol.Document memory doc = protocol.getDocument(tenantId, fileHash);
    if (doc.issuer == address(0)) {
        return (false, false, address(0), "");
    }
    return (true, doc.isValid, doc.issuer, doc.cid);
}
```

_Giải thích_

| **Thành phần**          | **Ý nghĩa kỹ thuật**                                            |
| ----------------------- | --------------------------------------------------------------- |
| **tenantId + fileHash** | Xác định duy nhất bản ghi tài liệu cần tra cứu.                 |
| **exists flag**         | Phân biệt chưa tồn tại với đã tồn tại nhưng bị revoke.          |
| **issuer + cid**        | Truy vết nguồn phát hành và vị trí IPFS trong tenant tương ứng. |

---

## 10. getDocumentOrRevert

> _**Mục tiêu:** Lấy đầy đủ metadata chứng thực, revert rõ ràng nếu tài liệu không tồn tại trong tenant. Hàm này hiện nằm trong `VoucherProtocolReader`._

_Code_

```solidity
function getDocumentOrRevert(bytes32 tenantId, bytes32 fileHash)
    external
    view
    returns (VoucherProtocol.Document memory)
{
    VoucherProtocol.Document memory doc = protocol.getDocument(tenantId, fileHash);
    if (doc.issuer == address(0)) revert VoucherProtocol.DocumentNotFound();
    return doc;
}
```

_Giải thích_

| **Thành phần**       | **Ý nghĩa kỹ thuật**                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| **tenantId**         | Bắt buộc xác định tenant trước khi đọc document.                                               |
| **DocumentNotFound** | Revert rõ ràng thay vì trả struct rỗng.                                                        |
| **Return Document**  | Trả cả `tenantId`, `cid`, `issuer`, `timestamp`, `isValid`, hash mã hoá, `docType`, `version`. |

---

## 11. revokeDocument

> _**Mục tiêu:** Thu hồi hiệu lực tài liệu bởi admin hoặc issuer khi sai phạm/hết hạn/cập nhật trong tenant tương ứng._

_Code_

```solidity
function revokeDocument(bytes32 tenantId, bytes32 fileHash, string calldata reason) external {
    // Trỏ trực tiếp tới storage để cập nhật trạng thái tài liệu.
    Document storage doc = documents[tenantId][fileHash];
    // Nếu không tìm thấy tài liệu thì không thể revoke.
    if (doc.issuer == address(0)) revert DocumentNotFound();
    // Chỉ tenant admin hoặc issuer gốc mới có quyền revoke.
    if (!hasRole(_getTenantAdminRole(tenantId), msg.sender) && msg.sender != doc.issuer) revert Unauthorized();
    // Nếu tài liệu đã bị revoke trước đó thì chặn revoke lặp.
    if (!doc.isValid) revert DocumentAlreadyRevoked();

    // Đánh dấu tài liệu mất hiệu lực nhưng vẫn giữ audit trail on-chain.
    doc.isValid = false;

    // Phát event revoke kèm lý do nghiệp vụ.
    emit DocumentRevoked(tenantId, fileHash, msg.sender, reason);
}
```

_Giải thích_

| **Thành phần**          | **Ý nghĩa kỹ thuật**                                      |
| ----------------------- | --------------------------------------------------------- |
| **TENANT_ADMIN_ROLE**   | Quyền revoke ở tenant-level, không ảnh hưởng tenant khác. |
| **issuer quyền revoke** | Issuer gốc vẫn có quyền thu hồi document của chính mình.  |
| **isValid = false**     | Giữ nguyên audit trail, không xoá dữ liệu.                |
| **reason**              | Ghi rõ lý do thu hồi.                                     |

---

## 12. setOperatorStatus

> _**Mục tiêu:** Quản lý trạng thái hoạt động cụ thể của operator theo role quản trị trong từng tenant._

_Code_

```solidity
function setOperatorStatus(
    bytes32 tenantId,
    address operator,
    bool isActive,
    string calldata reason
) external {
    // Tenant phải tồn tại trước khi quản lý operator.
    if (tenants[tenantId].admin == address(0)) revert TenantNotFound();
    // Chỉ role operator manager của tenant mới được thay đổi trạng thái.
    if (!hasRole(_getTenantOperatorManagerRole(tenantId), msg.sender)) revert Unauthorized();
    // Operator phải có stake trong tenant thì mới được quản lý trạng thái.
    if (operators[tenantId][operator].stakeAmount == 0) revert NoStake();

    // Ghi trạng thái active/inactive mới cho operator.
    operators[tenantId][operator].isActive = isActive;
    // Nếu chuyển inactive thì huỷ luôn lịch unstake cũ để tránh trạng thái mồ côi.
    if (!isActive) {
        pendingUnstakeAt[tenantId][operator] = 0;
    }

    // Phát event trạng thái để audit trail đầy đủ.
    emit OperatorStatusUpdated(tenantId, operator, isActive, reason);
}
```

_Giải thích_

| **Thành phần**                     | **Ý nghĩa kỹ thuật**                                          |
| ---------------------------------- | ------------------------------------------------------------- |
| **\_getTenantOperatorManagerRole** | Role quản lý operator được tách riêng theo tenant.            |
| **stakeAmount > 0**                | Chỉ operator thực sự tồn tại trong tenant mới được quản lý.   |
| **pendingUnstake reset**           | Tránh trạng thái unstake cũ còn tồn tại khi operator bị khóa. |
| **reason**                         | Ghi rõ nguyên nhân thay đổi trạng thái.                       |

---

## 13. setTreasury

> _**Mục tiêu:** Cập nhật địa chỉ nhận tiền từ cơ chế slashing trong từng tenant._

_Code_

```solidity
function setTreasury(bytes32 tenantId, address newTreasury) external {
    // Tenant phải tồn tại trước khi cập nhật treasury.
    if (tenants[tenantId].admin == address(0)) revert TenantNotFound();
    // Chỉ tenant admin mới được đổi treasury.
    if (!hasRole(_getTenantAdminRole(tenantId), msg.sender)) revert Unauthorized();
    // Treasury mới không được là zero address.
    if (newTreasury == address(0)) revert InvalidTenantAddress();

    // Lưu lại treasury cũ để phát event đối chiếu.
    address oldTreasury = tenants[tenantId].treasury;
    // Gán treasury mới cho tenant.
    tenants[tenantId].treasury = newTreasury;

    // Phát event để theo dõi lịch sử đổi treasury.
    emit TreasuryUpdated(tenantId, oldTreasury, newTreasury);
}
```

_Giải thích_

| **Thành phần**           | **Ý nghĩa kỹ thuật**                           |
| ------------------------ | ---------------------------------------------- |
| **tenantId**             | Mỗi tenant có treasury độc lập.                |
| **\_getTenantAdminRole** | Chỉ admin của tenant đó mới đổi được treasury. |
| **oldTreasury**          | Dùng cho audit trail thay đổi ví nhận slash.   |

---

## 14. slashOperator

> _**Mục tiêu:** Hard slash operator vi phạm bằng cách tịch thu 100% stake về treasury của tenant._

_Code_

```solidity
function slashOperator(
    bytes32 tenantId,
    address _operator,
    string calldata reason
) external nonReentrant {
    // Tenant phải tồn tại trước khi thực thi hard slash.
    if (tenants[tenantId].admin == address(0)) revert TenantNotFound();
    // Chỉ slasher role của tenant mới được slash.
    if (!hasRole(_getTenantSlasherRole(tenantId), msg.sender)) revert Unauthorized();

    // Lấy stake hiện tại của operator bị xử lý.
    uint256 amount = operators[tenantId][_operator].stakeAmount;
    // Nếu không có stake thì không có gì để slash.
    if (amount == 0) revert NoStake();

    // Vô hiệu hoá operator ngay lập tức.
    operators[tenantId][_operator].isActive = false;
    // Reset stake về 0 để hoàn tất xử lý kinh tế.
    operators[tenantId][_operator].stakeAmount = 0;
    // Xoá pending unstake để tránh trạng thái cũ còn tồn tại.
    pendingUnstakeAt[tenantId][_operator] = 0;
    // Xoá recovery delegate để tránh recovery trái ý sau khi slash.
    delete recoveryDelegates[tenantId][_operator];

    // Chuyển toàn bộ stake bị slash về treasury của tenant.
    (bool sent, ) = payable(tenants[tenantId].treasury).call{value: amount}("");
    // Nếu chuyển ETH thất bại thì revert toàn bộ giao dịch.
    if (!sent) revert EthTransferFailed();

    // Phát event hard slash để phục vụ audit/compliance.
    emit OperatorSlashed(tenantId, _operator, amount, msg.sender, reason);
    // Phát event trạng thái sau xử lý slash.
    emit OperatorStatusUpdated(tenantId, _operator, false, "SLASHED");
}
```

_Giải thích_

| **Thành phần**               | **Ý nghĩa kỹ thuật**                             |
| ---------------------------- | ------------------------------------------------ |
| **\_getTenantSlasherRole**   | Quyền hard slash được tách riêng theo tenant.    |
| **Hard slash 100%**          | Vẫn giữ nguyên semantics tịch thu toàn bộ stake. |
| **tenant treasury**          | Tiền slash chuyển về treasury của đúng tenant.   |
| **delete recoveryDelegates** | Giảm rủi ro recovery sau khi đã bị hard slash.   |

---

## 15. setRecoveryDelegate

> _**Mục tiêu:** Cho operator cấu hình trước một ví dự phòng để xử lý tình huống mất private key trong tenant tương ứng._

_Code_

```solidity
function setRecoveryDelegate(bytes32 tenantId, address delegate) external {
    // Tenant phải tồn tại trước khi cấu hình recovery.
    if (tenants[tenantId].admin == address(0)) revert TenantNotFound();
    // Operator phải đang active mới được tự cấu hình delegate.
    if (!operators[tenantId][msg.sender].isActive) revert OperatorNotActive();
    // Delegate không được là zero address.
    if (delegate == address(0)) revert InvalidRecoveryTarget();
    // Delegate không được trỏ về chính operator hiện tại.
    if (delegate == msg.sender) revert InvalidRecoveryTarget();

    // Lưu delegate dự phòng cho operator trong tenant này.
    recoveryDelegates[tenantId][msg.sender] = delegate;

    // Phát event để indexer theo dõi thay đổi recovery delegate.
    emit OperatorRecoveryDelegateUpdated(tenantId, msg.sender, delegate);
}
```

_Giải thích_

| **Thành phần**                            | **Ý nghĩa kỹ thuật**                               |
| ----------------------------------------- | -------------------------------------------------- |
| **recoveryDelegates[tenantId][operator]** | Delegate được lưu riêng theo từng tenant.          |
| **delegate != address(0)**                | Tránh cấu hình rỗng.                               |
| **delegate != operator**                  | Tránh tự trỏ về chính ví hiện tại.                 |
| **event có tenantId**                     | Giúp audit lịch sử recovery chính xác theo tenant. |

---

## 16. recoverOperatorByDelegate

> _**Mục tiêu:** Cho ví dự phòng đã đăng ký tự nhận quyền operator khi ví cũ bị mất trong đúng tenant._

_Code_

```solidity
function recoverOperatorByDelegate(bytes32 tenantId, address lostOperator, string calldata reason) external {
    // Tenant phải tồn tại trước khi chạy recovery.
    if (tenants[tenantId].admin == address(0)) revert TenantNotFound();
    // Operator cũ phải không active thì mới xem là bị mất/offline.
    if (operators[tenantId][lostOperator].isActive) revert OperatorNotLost();
    // Operator cũ phải còn stake thì recovery mới có ý nghĩa.
    if (operators[tenantId][lostOperator].stakeAmount == 0) revert NoStakeToRecover();
    // Không cho recovery nếu operator đang ở giữa luồng unstake.
    if (pendingUnstakeAt[tenantId][lostOperator] > 0) revert UnstakeInProgress();
    // Chỉ delegate đã đăng ký trước đó mới được phép recovery.
    if (recoveryDelegates[tenantId][lostOperator] != msg.sender) revert RecoveryNotAllowed();
    // Không cho migrate vào ví đích đã có dữ liệu operator sẵn.
    if (operators[tenantId][msg.sender].stakeAmount != 0 || operators[tenantId][msg.sender].isActive) {
        revert InvalidRecoveryTarget();
    }

    // Lấy snapshot operator cũ để migrate toàn bộ trạng thái.
    Operator memory oldData = operators[tenantId][lostOperator];
    // Double-check stake tồn tại trước khi migrate.
    if (oldData.stakeAmount == 0) revert NoStake();

    // Ghi operator mới bằng dữ liệu cũ nhưng đổi ví điều khiển.
    operators[tenantId][msg.sender] = Operator({
        tenantId: tenantId,
        metadataURI: oldData.metadataURI,
        stakeAmount: oldData.stakeAmount,
        isActive: oldData.isActive
    });
    // Chuyển nonce sang ví mới để đảm bảo continuity của chữ ký.
    nonces[tenantId][msg.sender] = nonces[tenantId][lostOperator];
    // Reset pending unstake cho ví mới.
    pendingUnstakeAt[tenantId][msg.sender] = 0;

    // Xoá dữ liệu operator cũ sau khi migrate xong.
    delete operators[tenantId][lostOperator];
    // Xoá nonce cũ để tránh tái sử dụng ngoài ý muốn.
    delete nonces[tenantId][lostOperator];
    // Xoá mốc pending unstake của ví cũ.
    delete pendingUnstakeAt[tenantId][lostOperator];
    // Xoá recovery delegate cũ để operator mới tự cấu hình lại.
    delete recoveryDelegates[tenantId][lostOperator];

    // Phát event recovery để audit trail đầy đủ.
    emit OperatorRecovered(tenantId, lostOperator, msg.sender, oldData.stakeAmount, reason);
    // Phát event reset delegate của ví mới về rỗng logic.
    emit OperatorRecoveryDelegateUpdated(tenantId, msg.sender, address(0));
}
```

_Giải thích_

| **Thành phần**               | **Ý nghĩa kỹ thuật**                                                    |
| ---------------------------- | ----------------------------------------------------------------------- |
| **OperatorNotLost**          | Bảo vệ logic recovery: chỉ recovery khi ví cũ thực sự không còn active. |
| **RecoveryNotAllowed**       | Chỉ delegate đã đăng ký trong đúng tenant mới được nhận quyền.          |
| **Migrate operator + nonce** | Giữ continuity của stake, metadata và luồng ký EIP-712.                 |
| **delete state cũ**          | Dọn sạch dữ liệu ví cũ sau khi recovery.                                |

---

## 17. recoverOperatorByAdmin

> _**Mục tiêu:** Cho governance xử lý khẩn cấp khi operator mất ví nhưng chưa cấu hình delegate hoặc delegate không dùng được._

_Code_

```solidity
function recoverOperatorByAdmin(
    bytes32 tenantId,
    address lostOperator,
    address newOperator,
    string calldata reason
) external {
    // Tenant phải tồn tại trước khi governance can thiệp recovery.
    if (tenants[tenantId].admin == address(0)) revert TenantNotFound();
    // Chỉ operator-manager role của tenant mới được recovery khẩn cấp.
    if (!hasRole(_getTenantOperatorManagerRole(tenantId), msg.sender)) revert Unauthorized();
    // Operator cũ phải không active mới được coi là bị mất.
    if (operators[tenantId][lostOperator].isActive) revert OperatorNotLost();
    // Ví mới phải hợp lệ và không được trùng ví cũ.
    if (newOperator == address(0) || newOperator == lostOperator) revert InvalidRecoveryTarget();
    // Ví mới không được ghi đè lên operator đã tồn tại.
    if (operators[tenantId][newOperator].stakeAmount != 0 || operators[tenantId][newOperator].isActive) {
        revert InvalidRecoveryTarget();
    }

    // Lấy snapshot operator cũ để migrate.
    Operator memory oldData = operators[tenantId][lostOperator];
    // Operator cũ phải còn stake thì mới cần recovery.
    if (oldData.stakeAmount == 0) revert NoStake();

    // Ghi dữ liệu operator cũ sang ví mới trong cùng tenant.
    operators[tenantId][newOperator] = Operator({
        tenantId: tenantId,
        metadataURI: oldData.metadataURI,
        stakeAmount: oldData.stakeAmount,
        isActive: oldData.isActive
    });
    // Chuyển nonce sang ví mới để tiếp tục flow EIP-712.
    nonces[tenantId][newOperator] = nonces[tenantId][lostOperator];
    // Reset pending unstake cho ví mới.
    pendingUnstakeAt[tenantId][newOperator] = 0;

    // Xoá dữ liệu ví cũ sau khi migrate xong.
    delete operators[tenantId][lostOperator];
    // Xoá nonce của ví cũ.
    delete nonces[tenantId][lostOperator];
    // Xoá pending unstake của ví cũ.
    delete pendingUnstakeAt[tenantId][lostOperator];
    // Xoá delegate recovery của ví cũ.
    delete recoveryDelegates[tenantId][lostOperator];

    // Phát event recovery để audit khẩn cấp.
    emit OperatorRecovered(tenantId, lostOperator, newOperator, oldData.stakeAmount, reason);
    // Phát event reset delegate cho ví mới.
    emit OperatorRecoveryDelegateUpdated(tenantId, newOperator, address(0));
}
```

_Giải thích_

| **Thành phần**                     | **Ý nghĩa kỹ thuật**                                   |
| ---------------------------------- | ------------------------------------------------------ |
| **\_getTenantOperatorManagerRole** | Governance recovery giờ scoped theo tenant.            |
| **InvalidRecoveryTarget**          | Chặn ghi đè ví mới không hợp lệ hoặc đã tồn tại state. |
| **Migrate state có kiểm soát**     | Giữ continuity nghiệp vụ trong cùng tenant.            |
| **reason**                         | Audit rõ lý do recovery khẩn cấp.                      |

---

## 18. coSignDocumentWithSignature

> _**Mục tiêu:** Đồng ký tài liệu theo cơ chế tin cậy 3 lớp: whitelist theo docType + stake tối thiểu + quorum theo role trong phạm vi tenant._

_Code_

```solidity
function coSignDocumentWithSignature(
    CoSignPayload calldata payload,
    bytes calldata signature
) external nonReentrant {
    // Tenant phải tồn tại trước khi nhận co-sign.
    if (tenants[payload.tenantId].admin == address(0)) revert TenantNotFound();
    // Tenant inactive thì không cho co-sign thêm.
    if (!tenants[payload.tenantId].isActive) revert TenantInactive();
    // Chữ ký quá hạn thì từ chối xử lý.
    if (block.timestamp > payload.deadline) revert ExpiredSignature();

    // Đọc bản ghi tài liệu cần đồng ký.
    Document memory doc = documents[payload.tenantId][payload.fileHash];
    // Tài liệu phải tồn tại mới co-sign được.
    if (doc.issuer == address(0)) revert DocumentNotFound();
    // Tài liệu đã revoke thì không cho co-sign mới.
    if (!doc.isValid) revert DocumentNotValid();

    // Recover signer thực sự từ payload co-sign.
    address signer = _recoverCoSigner(payload, signature);
    // Signer phải là operator thuộc tenant tương ứng.
    if (operators[payload.tenantId][signer].stakeAmount == 0) revert OperatorNotInTenant();
    // Signer phải đang active thì mới được đồng ký.
    if (!operators[payload.tenantId][signer].isActive) revert OperatorNotActive();
    // Nonce phải khớp để chống replay attack.
    if (nonces[payload.tenantId][signer] != payload.nonce) revert InvalidSignature();
    // Một signer không được ký hai lần cho cùng tài liệu trong cùng tenant.
    if (documentSigners[payload.tenantId][payload.fileHash][signer]) revert AlreadyCoSigned();

    // Nạp policy co-sign áp dụng cho docType của tài liệu.
    CoSignPolicy memory policy = tenantCoSignPolicies[payload.tenantId][doc.docType];
    // Khởi tạo roleMask mặc định = 0 trước khi đánh giá policy.
    uint256 roleMask = 0;
    // Nếu policy đang bật thì ép signer phải đạt đủ điều kiện whitelist/stake/role.
    if (policy.enabled) {
        roleMask = _enforceCoSignPolicy(payload.tenantId, doc.docType, signer, policy.minStake);
    }

    // Đánh dấu signer này đã ký tài liệu.
    documentSigners[payload.tenantId][payload.fileHash][signer] = true;
    // Tính tổng số signer mới sau khi thêm chữ ký này.
    uint256 updatedCount = coSignCount[payload.tenantId][payload.fileHash] + 1;
    // Lưu tổng số signer mới cho tài liệu.
    coSignCount[payload.tenantId][payload.fileHash] = updatedCount;

    // Tăng nonce của signer sau khi đồng ký thành công.
    nonces[payload.tenantId][signer] = payload.nonce + 1;

    // Nếu policy bật thì cập nhật trusted signer count và role mask.
    if (policy.enabled) {
        // Tăng số trusted signer cho tài liệu.
        trustedCoSignCount[payload.tenantId][payload.fileHash] += 1;
        // Hợp nhất role mask của signer mới vào role mask tổng.
        trustedCoSignRoleMask[payload.tenantId][payload.fileHash] |= roleMask;
        // Đánh giá lại xem tài liệu đã đủ quorum chưa.
        _evaluateCoSignQualification(payload.tenantId, payload.fileHash, doc.docType);
    }

    // Phát event nonce để phục vụ audit replay-protection.
    emit NonceConsumed(payload.tenantId, signer, payload.nonce, payload.nonce + 1);
    // Phát event co-sign để frontend/indexer cập nhật.
    emit DocumentCoSigned(payload.tenantId, payload.fileHash, signer, updatedCount);
}
```

_Giải thích_

| **Thành phần**                    | **Ý nghĩa kỹ thuật**                                        |
| --------------------------------- | ----------------------------------------------------------- |
| **payload.tenantId**              | Co-sign được gắn chặt vào đúng tenant.                      |
| **AlreadyCoSigned**               | Chặn một signer ký lặp trên cùng document của cùng tenant.  |
| **tenantCoSignPolicies**          | Chính sách co-sign tách riêng theo tenant và `docType`.     |
| **trustedCoSignCount + roleMask** | Tiếp tục giữ quorum logic như cũ, nhưng ở namespace tenant. |

---

## 19. \_recoverCoSigner

> _**Mục tiêu:** Recover signer cho luồng đồng ký với schema EIP-712 riêng và có ràng buộc tenant._

_Code_

```solidity
function _recoverCoSigner(CoSignPayload calldata payload, bytes calldata signature)
    internal
    view
    returns (address signer)
{
    // Băm payload co-sign theo schema COSIGN_TYPEHASH.
    bytes32 structHash = keccak256(abi.encode(
        COSIGN_TYPEHASH,
        payload.tenantId,
        payload.fileHash,
        payload.nonce,
        payload.deadline
    ));

    // Kết hợp domain và structHash để tạo typed-data digest cuối cùng.
    bytes32 digest = MessageHashUtils.toTypedDataHash(DOMAIN_SEPARATOR, structHash);
    // Recover signer từ digest và chữ ký tương ứng.
    signer = digest.recover(signature);
    // Recover thất bại thì xem như chữ ký không hợp lệ.
    if (signer == address(0)) revert InvalidSignature();
}
```

_Giải thích_

| **Thành phần**            | **Ý nghĩa kỹ thuật**                       |
| ------------------------- | ------------------------------------------ |
| **COSIGN_TYPEHASH**       | Schema riêng cho luồng đồng ký.            |
| **tenantId trong digest** | Chặn reuse chữ ký co-sign giữa các tenant. |
| **TypedData digest**      | Giữ nguyên chuẩn bảo mật EIP-712.          |

---

## 20. hasSignedDocument

> _**Mục tiêu:** Cung cấp API query nhanh để kiểm tra 1 địa chỉ đã tham gia ký tài liệu hay chưa trong tenant tương ứng. Hàm này hiện nằm trong `VoucherProtocolReader`._

_Code_

```solidity
function hasSignedDocument(bytes32 tenantId, bytes32 fileHash, address signer) external view returns (bool) {
    return protocol.documentSigners(tenantId, fileHash, signer);
}
```

_Giải thích_

| **Thành phần**                   | **Ý nghĩa kỹ thuật**                                           |
| -------------------------------- | -------------------------------------------------------------- |
| **tenantId + fileHash + signer** | Khóa tra cứu chính xác cho một chữ ký trong một tenant cụ thể. |
| **View helper**                  | Frontend/indexer tra cứu mà không tốn gas.                     |

---

## 21. setCoSignPolicy

> _**Mục tiêu:** Governance cấu hình policy co-sign theo từng `docType` để tránh operator ký bừa bãi trong tenant._

_Code_

```solidity
function setCoSignPolicy(
    bytes32 tenantId,
    uint32 docType,
    bool enabled,
    uint256 minStake,
    uint256 minSigners,
    uint256 requiredRoleMask
) external {
    // Tenant phải tồn tại trước khi đổi policy.
    if (tenants[tenantId].admin == address(0)) revert TenantNotFound();
    // Chỉ operator-manager role của tenant mới được đổi policy.
    if (!hasRole(_getTenantOperatorManagerRole(tenantId), msg.sender)) revert Unauthorized();
    // Nếu bật policy thì phải có ít nhất một điều kiện quorum hữu nghĩa.
    if (enabled && minSigners == 0 && requiredRoleMask == 0) revert InvalidCoSignPolicy();

    // Lưu toàn bộ policy mới cho docType trong tenant này.
    tenantCoSignPolicies[tenantId][docType] = CoSignPolicy({
        enabled: enabled,
        minStake: minStake,
        minSigners: minSigners,
        requiredRoleMask: requiredRoleMask
    });

    // Phát event để audit thay đổi policy co-sign.
    emit CoSignPolicyUpdated(tenantId, docType, enabled, minStake, minSigners, requiredRoleMask);
}
```

_Giải thích_

| **Thành phần**          | **Ý nghĩa kỹ thuật**                                     |
| ----------------------- | -------------------------------------------------------- |
| **tenantId**            | Policy co-sign được cô lập hoàn toàn theo tenant.        |
| **docType policy**      | Mỗi loại tài liệu vẫn có rule riêng như trước.           |
| **requiredRoleMask**    | Tiếp tục cho phép quorum role tối đa 256 vai trò.        |
| **InvalidCoSignPolicy** | Chặn policy bật nhưng không có điều kiện quorum hữu ích. |

---

## 22. setCoSignOperator

> _**Mục tiêu:** Quản trị whitelist và role co-sign cho từng operator theo `docType` trong tenant._

_Code_

```solidity
function setCoSignOperator(
    bytes32 tenantId,
    uint32 docType,
    address operator,
    bool whitelisted,
    uint16 roleId
) external {
    // Tenant phải tồn tại trước khi cấu hình whitelist.
    if (tenants[tenantId].admin == address(0)) revert TenantNotFound();
    // Chỉ operator-manager role của tenant mới được cấu hình co-sign operator.
    if (!hasRole(_getTenantOperatorManagerRole(tenantId), msg.sender)) revert Unauthorized();
    // Operator không được là zero address.
    if (operator == address(0)) revert Unauthorized();

    // Nếu thêm vào whitelist thì role bắt buộc phải hợp lệ.
    if (whitelisted) {
        if (roleId < MIN_COSIGN_ROLE_ID || roleId > MAX_COSIGN_ROLE_ID) revert InvalidCoSignRole();
        tenantCoSignRoles[tenantId][docType][operator] = roleId;
    } else {
        // Nếu bỏ khỏi whitelist thì reset role về NONE.
        tenantCoSignRoles[tenantId][docType][operator] = COSIGN_ROLE_NONE;
    }

    // Cập nhật trạng thái whitelist cho operator theo docType.
    tenantCoSignWhitelisted[tenantId][docType][operator] = whitelisted;

    // Phát event cấu hình operator để phục vụ audit/compliance.
    emit CoSignOperatorConfigured(
        tenantId,
        docType,
        operator,
        whitelisted,
        tenantCoSignRoles[tenantId][docType][operator]
    );
}
```

_Giải thích_

| **Thành phần**              | **Ý nghĩa kỹ thuật**                                          |
| --------------------------- | ------------------------------------------------------------- |
| **tenantCoSignWhitelisted** | Danh sách whitelist nằm riêng trong mỗi tenant.               |
| **tenantCoSignRoles**       | Role co-sign được quản lý riêng cho từng tenant và `docType`. |
| **COSIGN_ROLE_NONE**        | Khi remove khỏi whitelist thì role được reset rõ ràng.        |

---

## 23. isDocumentCoSignQualified

> _**Mục tiêu:** Trả trạng thái cuối cùng liệu tài liệu đã đạt chuẩn co-sign theo policy hay chưa trong tenant. Hàm này hiện nằm trong `VoucherProtocolReader`._

_Code_

```solidity
function isDocumentCoSignQualified(bytes32 tenantId, bytes32 fileHash) external view returns (bool) {
    return protocol.coSignQualified(tenantId, fileHash);
}
```

_Giải thích_

| **Thành phần**                          | **Ý nghĩa kỹ thuật**                                              |
| --------------------------------------- | ----------------------------------------------------------------- |
| **coSignQualified[tenantId][fileHash]** | Cờ qualified được tính riêng cho document trong tenant tương ứng. |

---

## 24. getCoSignStatus

> _**Mục tiêu:** Cung cấp snapshot đầy đủ tiến trình co-sign để frontend/auditor theo dõi quorum trong tenant. Hàm này hiện nằm trong `VoucherProtocolReader`._

_Code_

```solidity
function getCoSignStatus(bytes32 tenantId, bytes32 fileHash)
    external
    view
    returns (
        bool qualified,
        uint256 totalSigners,
        uint256 trustedSigners,
        uint256 currentRoleMask,
        uint256 requiredRoleMask,
        uint256 minSigners,
        uint256 minStake
    )
{
    VoucherProtocol.Document memory doc = protocol.getDocument(tenantId, fileHash);
    if (doc.issuer == address(0)) revert VoucherProtocol.DocumentNotFound();

    VoucherProtocol.CoSignPolicy memory policy = protocol.getCoSignPolicyStruct(tenantId, doc.docType);

    return (
        protocol.coSignQualified(tenantId, fileHash),
        protocol.coSignCount(tenantId, fileHash),
        protocol.trustedCoSignCount(tenantId, fileHash),
        protocol.trustedCoSignRoleMask(tenantId, fileHash),
        policy.requiredRoleMask,
        policy.minSigners,
        policy.minStake
    );
}
```

_Giải thích_

| **Thành phần**       | **Ý nghĩa kỹ thuật**                                               |
| -------------------- | ------------------------------------------------------------------ |
| **tenantId**         | Snapshot trạng thái chỉ áp dụng cho document của tenant tương ứng. |
| **totalSigners**     | Tổng số chữ ký ghi nhận cho tài liệu.                              |
| **trustedSigners**   | Số signer đạt đủ whitelist + stake + role.                         |
| **roleMask so sánh** | Cho biết còn thiếu role nào để đạt quorum.                         |

---

## 25. setMinOperatorStake

> _**Mục tiêu:** Mở khả năng scale vận hành bằng cấu hình stake tối thiểu theo từng tenant thay vì hard-code cố định dùng chung._

_Code_

```solidity
function setMinOperatorStake(bytes32 tenantId, uint256 newMinOperatorStake) external {
    // Tenant phải tồn tại trước khi đổi stake tối thiểu.
    if (tenants[tenantId].admin == address(0)) revert TenantNotFound();
    // Chỉ operator-manager role của tenant mới được đổi cấu hình này.
    if (!hasRole(_getTenantOperatorManagerRole(tenantId), msg.sender)) revert Unauthorized();
    // Stake tối thiểu không được bằng 0.
    if (newMinOperatorStake == 0) revert InvalidConfigValue();

    // Lưu giá trị cũ để phát event đối chiếu.
    uint256 oldValue = tenantMinOperatorStake[tenantId];
    // Gán giá trị stake tối thiểu mới cho tenant.
    tenantMinOperatorStake[tenantId] = newMinOperatorStake;

    // Phát event theo dõi thay đổi onboarding threshold.
    emit MinOperatorStakeUpdated(tenantId, oldValue, newMinOperatorStake);
}
```

_Giải thích_

| **Thành phần**             | **Ý nghĩa kỹ thuật**                          |
| -------------------------- | --------------------------------------------- |
| **tenantMinOperatorStake** | Mỗi tenant có ngưỡng stake tối thiểu riêng.   |
| **InvalidConfigValue**     | Chặn cấu hình 0 làm vô hiệu economic barrier. |
| **event có tenantId**      | Dễ audit thay đổi config của từng tenant.     |

---

## 26. setUnstakeCooldown

> _**Mục tiêu:** Cho phép tinh chỉnh thời gian chờ rút stake theo thực tế SLA/compliance của từng tenant._

_Code_

```solidity
function setUnstakeCooldown(bytes32 tenantId, uint256 newUnstakeCooldown) external {
    // Tenant phải tồn tại trước khi đổi cooldown.
    if (tenants[tenantId].admin == address(0)) revert TenantNotFound();
    // Chỉ operator-manager role của tenant mới được đổi cooldown.
    if (!hasRole(_getTenantOperatorManagerRole(tenantId), msg.sender)) revert Unauthorized();
    // Cooldown không được bằng 0.
    if (newUnstakeCooldown == 0) revert InvalidConfigValue();

    // Lưu giá trị cũ để phục vụ audit trail.
    uint256 oldValue = tenantUnstakeCooldown[tenantId];
    // Gán cooldown mới cho tenant.
    tenantUnstakeCooldown[tenantId] = newUnstakeCooldown;

    // Phát event thay đổi cooldown.
    emit UnstakeCooldownUpdated(tenantId, oldValue, newUnstakeCooldown);
}
```

_Giải thích_

| **Thành phần**            | **Ý nghĩa kỹ thuật**                                |
| ------------------------- | --------------------------------------------------- |
| **tenantUnstakeCooldown** | Cooldown được điều chỉnh độc lập cho từng tenant.   |
| **InvalidConfigValue**    | Chặn cấu hình 0 để luôn còn cửa sổ quan sát rủi ro. |

---

## 27. setViolationPenalty

> _**Mục tiêu:** Cho governance cấu hình mức phạt theo từng mã vi phạm để dùng cho soft slash trong từng tenant._

_Code_

```solidity
function setViolationPenalty(
    bytes32 tenantId,
    bytes32 violationCode,
    uint16 penaltyBps
) external {
    // Tenant phải tồn tại trước khi đổi mức phạt.
    if (tenants[tenantId].admin == address(0)) revert TenantNotFound();
    // Chỉ operator-manager role của tenant mới được đổi policy phạt.
    if (!hasRole(_getTenantOperatorManagerRole(tenantId), msg.sender)) revert Unauthorized();
    // Mã vi phạm không được rỗng.
    if (violationCode == bytes32(0)) revert InvalidConfigValue();
    // BPS phải nằm trong khoảng 1..10000.
    if (penaltyBps == 0 || penaltyBps > MAX_PENALTY_BPS) revert InvalidPenaltyBps(penaltyBps);

    // Lưu penalty cũ để phát event đối chiếu.
    uint16 oldPenalty = tenantViolationPenalties[tenantId][violationCode];
    // Gán penalty mới cho violation code trong tenant này.
    tenantViolationPenalties[tenantId][violationCode] = penaltyBps;

    // Phát event để audit thay đổi policy phạt.
    emit ViolationPenaltyUpdated(tenantId, violationCode, oldPenalty, penaltyBps);
}
```

_Giải thích_

| **Thành phần**               | **Ý nghĩa kỹ thuật**                                |
| ---------------------------- | --------------------------------------------------- |
| **tenantViolationPenalties** | Mức phạt được cấu hình riêng cho từng tenant.       |
| **violationCode**            | Mã hoá loại vi phạm để map sang mức phạt tương ứng. |
| **penaltyBps**               | Mức phạt basis points từ 1 đến 10000.               |
| **MAX_PENALTY_BPS**          | Không cho vượt 100% stake.                          |

---

## 28. softSlashOperator

> _**Mục tiêu:** Soft slash theo tỷ lệ đã cấu hình cho từng mã vi phạm, thay vì luôn tịch thu 100%, trong tenant tương ứng._

_Code_

```solidity
function softSlashOperator(
    bytes32 tenantId,
    address _operator,
    bytes32 violationCode,
    string calldata reason
) external nonReentrant {
    // Tenant phải tồn tại trước khi soft slash.
    if (tenants[tenantId].admin == address(0)) revert TenantNotFound();
    // Chỉ slasher role của tenant mới được thực thi soft slash.
    if (!hasRole(_getTenantSlasherRole(tenantId), msg.sender)) revert Unauthorized();

    // Lấy tổng stake hiện tại của operator bị xử lý.
    uint256 stakeBefore = operators[tenantId][_operator].stakeAmount;
    // Nếu không còn stake thì không có gì để slash.
    if (stakeBefore == 0) revert NoStake();

    // Đọc mức phạt đã cấu hình cho violation code tương ứng.
    uint16 penaltyBps = tenantViolationPenalties[tenantId][violationCode];
    // Nếu violation code chưa cấu hình penalty thì không cho soft slash.
    if (penaltyBps == 0) revert PenaltyNotConfigured(violationCode);

    // Tính số tiền bị phạt theo basis points.
    uint256 slashAmount = (stakeBefore * penaltyBps) / MAX_PENALTY_BPS;
    // Nếu làm tròn xuống thành 0 thì fallback tối thiểu 1 wei.
    if (slashAmount == 0) {
        slashAmount = 1;
    }

    // Tính stake còn lại sau khi áp dụng penalty.
    uint256 remaining = stakeBefore - slashAmount;
    // Ghi stake mới sau khi soft slash.
    operators[tenantId][_operator].stakeAmount = remaining;
    // Reset pending unstake để tránh né cooldown sau khi vi phạm.
    pendingUnstakeAt[tenantId][_operator] = 0;

    // Nếu stake còn lại xuống dưới ngưỡng hoạt động thì tự động inactive.
    if (remaining < tenantMinOperatorStake[tenantId]) {
        // Đánh dấu operator không còn active.
        operators[tenantId][_operator].isActive = false;
        // Xoá recovery delegate để giảm rủi ro phục hồi trái ý muốn.
        delete recoveryDelegates[tenantId][_operator];
        // Phát event trạng thái để phản ánh inactive do thiếu stake.
        emit OperatorStatusUpdated(tenantId, _operator, false, "SOFT_SLASHED_BELOW_MIN_STAKE");
    }

    // Chuyển số tiền bị phạt về treasury của tenant.
    (bool sent, ) = payable(tenants[tenantId].treasury).call{value: slashAmount}("");
    // Nếu chuyển ETH thất bại thì revert toàn bộ.
    if (!sent) revert EthTransferFailed();

    // Phát event soft slash với đầy đủ thông tin penalty.
    emit OperatorSoftSlashed(
        tenantId,
        _operator,
        violationCode,
        penaltyBps,
        slashAmount,
        remaining,
        msg.sender,
        reason
    );
}
```

_Giải thích_

| **Thành phần**                | **Ý nghĩa kỹ thuật**                                                 |
| ----------------------------- | -------------------------------------------------------------------- |
| **tenantId**                  | Toàn bộ penalty được áp dụng trong namespace tenant tương ứng.       |
| **PenaltyNotConfigured**      | Chỉ slash khi mã lỗi đã có policy phạt rõ ràng.                      |
| **slashAmount theo BPS**      | Giữ nguyên công thức `stake * penalty / 10000`.                      |
| **tenant treasury**           | Tiền phạt chuyển về treasury của tenant, không phải global treasury. |
| **Auto inactive dưới ngưỡng** | Nếu stake sau phạt thấp hơn threshold của tenant thì tự inactive.    |

---

## 29. createTenant

> _**Mục tiêu:** Khởi tạo một tenant mới với admin, treasury và bộ config mặc định hoàn toàn độc lập trong hệ thống multi-tenant._

_Code_

```solidity
function createTenant(
    bytes32 tenantId,
    address tenantAdmin,
    address tenantTreasury
) external onlyRole(PROTOCOL_ADMIN_ROLE) {
    // Tenant id không được rỗng vì sẽ dùng làm namespace cho toàn bộ dữ liệu.
    if (tenantId == bytes32(0)) revert InvalidConfigValue();
    // Admin và treasury phải là địa chỉ hợp lệ khác zero.
    if (tenantAdmin == address(0) || tenantTreasury == address(0)) revert InvalidTenantAddress();
    // Mỗi tenant id chỉ được khởi tạo duy nhất một lần.
    if (tenants[tenantId].admin != address(0)) revert TenantAlreadyExists();

    // Lưu tenant mới vào registry toàn cục.
    tenants[tenantId] = Tenant({
        admin: tenantAdmin,
        treasury: tenantTreasury,
        isActive: true,
        createdAt: block.timestamp
    });

    // Thêm tenant id vào danh sách để có thể enumerate off-chain.
    tenantList.push(tenantId);

    // Tạo và cấp role admin động gắn riêng cho tenant này.
    bytes32 tenantAdminRole = _getTenantAdminRole(tenantId);
    bytes32 tenantSlasherRole = _getTenantSlasherRole(tenantId);
    bytes32 tenantOperatorManagerRole = _getTenantOperatorManagerRole(tenantId);

    _grantRole(tenantAdminRole, tenantAdmin);
    _grantRole(tenantSlasherRole, tenantAdmin);
    _grantRole(tenantOperatorManagerRole, tenantAdmin);

    // Khởi tạo config mặc định cho tenant mới.
    tenantMinOperatorStake[tenantId] = MIN_STAKE;
    tenantUnstakeCooldown[tenantId] = UNSTAKE_COOLDOWN;

    // Phát event để indexer ghi nhận tenant vừa được tạo.
    emit TenantCreated(tenantId, tenantAdmin, tenantTreasury);
}
```

_Giải thích_

| **Thành phần**                | **Ý nghĩa kỹ thuật**                                                            |
| ----------------------------- | ------------------------------------------------------------------------------- |
| **PROTOCOL_ADMIN_ROLE**       | Chỉ protocol owner mới được tạo tenant mới, không cho phép bất kỳ ai tự tạo.    |
| **tenantId**                  | Đóng vai trò namespace cho toàn bộ dữ liệu operator/document/config của tenant. |
| **TenantAlreadyExists**       | Bảo đảm mỗi tenantId chỉ được khởi tạo 1 lần duy nhất.                          |
| **Dynamic role per tenant**   | 3 role được sinh và cấp tự động: ADMIN, SLASHER, OPERATOR_MANAGER.              |
| **tenantMinOperatorStake**    | Được khởi tạo từ hằng số `MIN_STAKE` làm giá trị mặc định ban đầu.              |
| **tenantUnstakeCooldown**     | Được khởi tạo từ hằng số `UNSTAKE_COOLDOWN` làm giá trị mặc định ban đầu.       |
| **tenantList.push(tenantId)** | Lưu vào mảng để có thể đọc danh sách tenant off-chain mà không cần event.       |

---

## 30. setTenantStatus

> _**Mục tiêu:** Bật hoặc tắt toàn bộ hoạt động của một tenant ở tầng protocol, ảnh hưởng đến mọi thao tác ghi trong tenant đó._

_Code_

```solidity
function setTenantStatus(bytes32 tenantId, bool isActive) external onlyRole(PROTOCOL_ADMIN_ROLE) {
    // Tenant phải tồn tại trước khi cập nhật trạng thái.
    if (tenants[tenantId].admin == address(0)) revert TenantNotFound();
    // Ghi trạng thái active/inactive mới cho tenant.
    tenants[tenantId].isActive = isActive;
    // Phát event để các hệ downstream đồng bộ trạng thái tenant.
    emit TenantStatusUpdated(tenantId, isActive);
}
```

_Giải thích_

| **Thành phần**          | **Ý nghĩa kỹ thuật**                                                                                                         |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **PROTOCOL_ADMIN_ROLE** | Chỉ protocol owner mới có quyền tắt/bật tenant, tenant admin không tự tắt được tenant của mình.                              |
| **TenantNotFound**      | Guard ngăn thao tác trên tenant chưa được khởi tạo.                                                                          |
| **isActive = false**    | Khi tenant bị tắt, `joinAsOperator`, `registerWithSignature`, `coSignDocumentWithSignature` đều revert với `TenantInactive`. |
| **TenantStatusUpdated** | Event giúp indexer/subgraph theo dõi vòng đời tenant theo thời gian thực.                                                    |

---

## 31. getTenantCount

> _**Mục tiêu:** Cung cấp API đọc nhanh tổng số tenant đã được khởi tạo để phục vụ pagination và enumerate off-chain. Hàm truy vấn này hiện nằm trong `VoucherProtocolReader`, còn `VoucherProtocol` giữ getter hỗ trợ `getTenantListLength()`._

_Code_

```solidity
function getTenantCount() external view returns (uint256) {
    return protocol.getTenantListLength();
}
```

_Giải thích_

| **Thành phần**        | **Ý nghĩa kỹ thuật**                                                             |
| --------------------- | -------------------------------------------------------------------------------- |
| **tenantList.length** | Mảng tăng dần theo mỗi lần `createTenant`, không bao giờ giảm.                   |
| **view**              | Không tốn gas khi đọc, phù hợp cho SDK/frontend gọi thường xuyên.                |
| **Dùng kết hợp**      | Kết hợp với `tenantList[i]` để enumerate toàn bộ tenantId không cần event query. |

---

## 32. \_enforceCoSignPolicy

> _**Mục tiêu:** Kiểm tra tổng hợp 3 điều kiện tin cậy của một signer (whitelist, stake tối thiểu, role hợp lệ) trước khi cho phép co-sign trong tenant._

_Code_

```solidity
function _enforceCoSignPolicy(
    bytes32 tenantId,
    uint32 docType,
    address signer,
    uint256 requiredStake
) internal view returns (uint256 roleMask) {
    // Chỉ signer nằm trong whitelist của docType mới được tiếp tục.
    if (!tenantCoSignWhitelisted[tenantId][docType][signer]) revert CoSignerNotWhitelisted();
    // Stake của signer phải đạt ngưỡng policy yêu cầu.
    if (operators[tenantId][signer].stakeAmount < requiredStake) {
        revert InsufficientCoSignStake(operators[tenantId][signer].stakeAmount, requiredStake);
    }

    // Lấy role đã cấu hình cho signer trong docType tương ứng.
    uint16 roleId = tenantCoSignRoles[tenantId][docType][signer];
    // Role phải nằm trong khoảng hợp lệ 1..256.
    if (roleId < MIN_COSIGN_ROLE_ID || roleId > MAX_COSIGN_ROLE_ID) revert InvalidCoSignRole();

    // Chuyển roleId sang bitmask để phục vụ quorum role.
    roleMask = _roleToMask(roleId);
}
```

_Giải thích_

| **Thành phần**              | **Ý nghĩa kỹ thuật**                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| **tenantCoSignWhitelisted** | Lớp 1: signer phải được cấp phép tường minh cho `docType` trong tenant đó.                  |
| **InsufficientCoSignStake** | Lớp 2: signer phải có đủ stake kinh tế theo policy, không cho ký bừa khi stake thấp.        |
| **InvalidCoSignRole**       | Lớp 3: role phải hợp lệ trong khoảng `1..256` để map sang bitmask đúng cho quorum.          |
| **roleMask return**         | Trả về bitmask của role để caller (`coSignDocumentWithSignature`) hợp nhất vào quorum mask. |
| **internal view**           | Chỉ được gọi nội bộ, không tốn gas thêm khi đọc state.                                      |

---

## 33. \_evaluateCoSignQualification

> _**Mục tiêu:** Đánh giá lại và cập nhật cờ `coSignQualified` khi có signer mới để xác định tài liệu đã đạt quorum co-sign hay chưa trong tenant._

_Code_

```solidity
function _evaluateCoSignQualification(bytes32 tenantId, bytes32 fileHash, uint32 docType) internal {
    // Nếu đã qualified rồi thì không xử lý lại để tránh emit lặp.
    if (coSignQualified[tenantId][fileHash]) return;

    // Nạp policy co-sign áp dụng cho docType hiện tại.
    CoSignPolicy memory policy = tenantCoSignPolicies[tenantId][docType];
    // Nếu policy đang tắt thì tài liệu mặc định được coi là qualified.
    if (!policy.enabled) {
        coSignQualified[tenantId][fileHash] = true;
        return;
    }

    // Kiểm tra điều kiện số lượng trusted signer.
    bool meetsSignerThreshold = trustedCoSignCount[tenantId][fileHash] >= policy.minSigners;
    // Kiểm tra điều kiện đủ toàn bộ role mask yêu cầu.
    bool meetsRoleMask = (
        trustedCoSignRoleMask[tenantId][fileHash] & policy.requiredRoleMask
    ) == policy.requiredRoleMask;

    // Nếu đạt đồng thời cả signer threshold lẫn role quorum.
    if (meetsSignerThreshold && meetsRoleMask) {
        coSignQualified[tenantId][fileHash] = true;
        // Phát event để indexer/frontend biết tài liệu vừa đạt quorum.
        emit DocumentCoSignQualified(
            tenantId,
            fileHash,
            trustedCoSignCount[tenantId][fileHash],
            trustedCoSignRoleMask[tenantId][fileHash]
        );
    }
}
```

_Giải thích_

| **Thành phần**                    | **Ý nghĩa kỹ thuật**                                                              |
| --------------------------------- | --------------------------------------------------------------------------------- |
| **Early return nếu qualified**    | Tránh tính toán lại và emit event `DocumentCoSignQualified` nhiều lần.            |
| **meetsSignerThreshold**          | Đủ số lượng trusted signer theo `policy.minSigners`.                              |
| **meetsRoleMask**                 | Tất cả bit trong `requiredRoleMask` phải được phủ bởi `trustedCoSignRoleMask`.    |
| **AND cả hai điều kiện**          | Tài liệu chỉ qualified khi đồng thời đủ cả số lượng lẫn đủ vai trò yêu cầu.       |
| **DocumentCoSignQualified event** | Phát khi vừa đạt ngưỡng, giúp frontend/subgraph cập nhật trạng thái ngay lập tức. |
| **internal**                      | Được gọi từ `registerWithSignature` và `coSignDocumentWithSignature`.             |

---

## 34. \_roleToMask

> _**Mục tiêu:** Chuyển đổi roleId (1-256) sang bitmask tương ứng để sử dụng trong hệ thống quorum role động._

_Code_

```solidity
function _roleToMask(uint16 roleId) internal pure returns (uint256) {
    // Role bắt đầu từ 1 nên cần trừ 1 để map sang vị trí bit 0-based.
    return uint256(1) << (roleId - 1);
}
```

_Giải thích_

| **Thành phần**      | **Ý nghĩa kỹ thuật**                                                              |
| ------------------- | --------------------------------------------------------------------------------- |
| **roleId - 1**      | Role 1 → bit 0, role 2 → bit 1, ..., role 256 → bit 255 (0-based indexing).       |
| **uint256 bitmask** | Cho phép đại diện tối đa 256 role khác nhau trong một biến 32-byte duy nhất.      |
| **Bitwise OR**      | Nhiều signer ký thì mask được hợp nhất bằng `\|=` để track đầy đủ các role đã có. |
| **Bitwise AND**     | `requiredRoleMask & currentMask == requiredRoleMask` để kiểm tra đủ quorum.       |
| **pure**            | Không đọc state, chỉ dùng tham số đầu vào, tối ưu gas hoàn toàn.                  |

---

## 35. \_getTenantAdminRole

> _**Mục tiêu:** Sinh ra bytes32 role admin duy nhất cho từng tenant để tách biệt quyền quản trị hoàn toàn giữa các tenant._

_Code_

```solidity
function _getTenantAdminRole(bytes32 tenantId) internal pure returns (bytes32) {
    // Băm tên role với tenantId để tạo namespace role riêng cho tenant.
    return keccak256(abi.encode("TENANT_ADMIN_ROLE", tenantId));
}
```

_Giải thích_

| **Thành phần**                     | **Ý nghĩa kỹ thuật**                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------------------- |
| **keccak256(abi.encode(...))**     | Tạo role ID duy nhất bằng cách băm tên cố định kết hợp với tenantId.                        |
| **"TENANT_ADMIN_ROLE" + tenantId** | Tenant A và Tenant B sẽ có 2 role khác nhau hoàn toàn, đảm bảo không thể dùng lẫn.          |
| **pure**                           | Không đọc state, kết quả hoàn toàn deterministic từ tenantId.                               |
| **Dùng ở đâu**                     | `createTenant`, `setTenantStatus` (grant), `revokeDocument`, `setTreasury` (hasRole check). |

---

## 36. \_getTenantSlasherRole

> _**Mục tiêu:** Sinh ra bytes32 role slasher duy nhất cho từng tenant để tách biệt quyền xử phạt operator giữa các tenant._

_Code_

```solidity
function _getTenantSlasherRole(bytes32 tenantId) internal pure returns (bytes32) {
    // Băm tên role với tenantId để tạo slasher role riêng cho tenant.
    return keccak256(abi.encode("TENANT_SLASHER_ROLE", tenantId));
}
```

_Giải thích_

| **Thành phần**                       | **Ý nghĩa kỹ thuật**                                                          |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| **"TENANT_SLASHER_ROLE" + tenantId** | Đảm bảo slasher của Tenant A không thể slash operator của Tenant B.           |
| **pure**                             | Deterministic, không phụ thuộc state.                                         |
| **Dùng ở đâu**                       | `createTenant` (grant), `slashOperator`, `softSlashOperator` (hasRole check). |

---

## 37. \_getTenantOperatorManagerRole

> _**Mục tiêu:** Sinh ra bytes32 role operator-manager duy nhất cho từng tenant để tách biệt quyền quản lý operator và config giữa các tenant._

_Code_

```solidity
function _getTenantOperatorManagerRole(bytes32 tenantId) internal pure returns (bytes32) {
    // Băm tên role với tenantId để tạo operator-manager role riêng cho tenant.
    return keccak256(abi.encode("TENANT_OPERATOR_MANAGER_ROLE", tenantId));
}
```

_Giải thích_

| **Thành phần**                                | **Ý nghĩa kỹ thuật**                                                                                                                                                                               |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **"TENANT_OPERATOR_MANAGER_ROLE" + tenantId** | Đảm bảo manager của Tenant A không thể config policy, whitelist, hoặc manage operator của Tenant B.                                                                                                |
| **pure**                                      | Deterministic, tái sử dụng nhiều nơi mà không cần lưu state.                                                                                                                                       |
| **Dùng ở đâu**                                | `createTenant` (grant), `setOperatorStatus`, `recoverOperatorByAdmin`, `setCoSignPolicy`, `setCoSignOperator`, `setMinOperatorStake`, `setUnstakeCooldown`, `setViolationPenalty` (hasRole check). |

---

## 38. getTenantIds

> _**Mục tiêu:** Cung cấp API query danh sách `tenantId` theo phân trang để thao tác off-chain dễ hơn (dashboard/SDK/indexer). Hàm này hiện nằm trong `VoucherProtocolReader`._

_Code_

```solidity
function getTenantIds(uint256 offset, uint256 limit) external view returns (bytes32[] memory ids) {
    uint256 total = protocol.getTenantListLength();
    if (offset >= total) {
        return new bytes32[](0);
    }

    uint256 end = offset + limit;
    if (end > total) {
        end = total;
    }

    ids = new bytes32[](end - offset);
    for (uint256 i = offset; i < end; i++) {
        ids[i - offset] = protocol.getTenantAtIndex(i);
    }
}
```

_Giải thích_

| **Thành phần**        | **Ý nghĩa kỹ thuật**                                                            |
| --------------------- | ------------------------------------------------------------------------------- |
| **offset/limit**      | Cho phép đọc danh sách tenant theo từng trang thay vì trả toàn bộ một lần.      |
| **offset >= total**   | Trả mảng rỗng khi vượt phạm vi, giúp phía client xử lý pagination an toàn.      |
| **end clamp**         | Đảm bảo không truy cập ngoài biên `tenantList`.                                 |
| **returns bytes32[]** | Trả trực tiếp danh sách `tenantId` để SDK/frontend có thể enumerate thuận tiện. |
| **view**              | Chỉ đọc state, không phát sinh thay đổi dữ liệu on-chain.                       |

---

## 39. getTenantInfo

> _**Mục tiêu:** Trả thông tin đầy đủ của một `tenantId` gồm trạng thái tồn tại, ví quản trị và trạng thái kích hoạt để thao tác off-chain thuận tiện. Hàm này hiện nằm trong `VoucherProtocolReader`._

_Code_

```solidity
function getTenantInfo(bytes32 tenantId)
    external
    view
    returns (
        bool exists,
        address admin,
        address treasury,
        bool isActive,
        uint256 createdAt
    )
{
    VoucherProtocol.Tenant memory tenant = protocol.getTenantStruct(tenantId);
    exists = tenant.admin != address(0);
    admin = tenant.admin;
    treasury = tenant.treasury;
    isActive = tenant.isActive;
    createdAt = tenant.createdAt;
}
```

_Giải thích_

| **Thành phần**       | **Ý nghĩa kỹ thuật**                                                                    |
| -------------------- | --------------------------------------------------------------------------------------- |
| **tenantId**         | Khoá truy vấn trực tiếp tenant cần kiểm tra.                                            |
| **exists**           | Phân biệt tenant chưa tạo (`false`) với tenant đã tồn tại (`true`) mà không cần revert. |
| **admin / treasury** | Trả về ví quản trị và ví nhận slash của tenant để SDK/dashboard hiển thị nhanh.         |
| **isActive**         | Cho biết tenant đang mở hay bị tạm khóa ở tầng protocol.                                |
| **createdAt**        | Mốc thời gian tạo tenant phục vụ audit và sorting timeline.                             |

---

## 40. getOperatorStatus

> _**Mục tiêu:** Trả trạng thái vận hành của operator trong một lần gọi để client giảm số lần query riêng lẻ. Hàm này hiện nằm trong `VoucherProtocolReader`._

_Code_

```solidity
function getOperatorStatus(bytes32 tenantId, address operator)
    external
    view
    returns (
        bool exists,
        bool isActive,
        string memory metadataURI,
        uint256 stakeAmount,
        uint256 nonce,
        uint256 unstakeReadyAt,
        bool canUnstakeNow,
        address recoveryDelegate
    )
{
    VoucherProtocol.Operator memory op = protocol.getOperatorStruct(tenantId, operator);
    exists = op.stakeAmount != 0 || op.isActive;

    isActive = op.isActive;
    metadataURI = op.metadataURI;
    stakeAmount = op.stakeAmount;
    nonce = protocol.nonces(tenantId, operator);
    unstakeReadyAt = protocol.pendingUnstakeAt(tenantId, operator);
    canUnstakeNow = unstakeReadyAt != 0 && block.timestamp >= unstakeReadyAt;
    recoveryDelegate = protocol.recoveryDelegates(tenantId, operator);
}
```

_Giải thích_

| **Thành phần**       | **Ý nghĩa kỹ thuật**                                            |
| -------------------- | --------------------------------------------------------------- |
| **exists**           | Xác định operator đã có state trong tenant hay chưa.            |
| **nonce**            | Lấy trực tiếp nonce ký EIP-712 theo tenant/operator.            |
| **unstakeReadyAt**   | Mốc thời gian sẵn sàng unstake nếu đã request trước đó.         |
| **canUnstakeNow**    | Cờ tiện dụng cho UI/backend để quyết định gọi `executeUnstake`. |
| **recoveryDelegate** | Trả ví delegate hiện tại để hiển thị/đối soát bảo mật.          |

---

## 41. getDocumentStatus

> _**Mục tiêu:** Trả snapshot tài liệu và trạng thái co-sign trong cùng một response. Hàm này hiện nằm trong `VoucherProtocolReader` và trả về `DocumentSnapshot`._

_Code_

```solidity
function getDocumentStatus(bytes32 tenantId, bytes32 fileHash)
    external
    view
    returns (VoucherProtocol.DocumentSnapshot memory)
{
    VoucherProtocol.Document memory doc = protocol.getDocument(tenantId, fileHash);
    if (doc.issuer == address(0)) {
        return VoucherProtocol.DocumentSnapshot(
            false, false, address(0), "", 0, bytes32(0), bytes32(0), 0, 0, 0, 0, 0, false
        );
    }

    return VoucherProtocol.DocumentSnapshot(
        true,
        doc.isValid,
        doc.issuer,
        doc.cid,
        doc.timestamp,
        doc.ciphertextHash,
        doc.encryptionMetaHash,
        doc.docType,
        doc.version,
        protocol.coSignCount(tenantId, fileHash),
        protocol.trustedCoSignCount(tenantId, fileHash),
        protocol.trustedCoSignRoleMask(tenantId, fileHash),
        protocol.coSignQualified(tenantId, fileHash)
    );
}
```

_Giải thích_

| **Thành phần**        | **Ý nghĩa kỹ thuật**                                                  |
| --------------------- | --------------------------------------------------------------------- |
| **exists**            | Nếu chưa anchor thì trả `false` thay vì revert.                       |
| **Document metadata** | Trả đủ issuer, cid, hash mã hoá, docType, version, timestamp.         |
| **co-sign progress**  | Trả `totalSigners`, `trustedSigners`, `currentRoleMask`, `qualified`. |
| **Một lần gọi**       | Giảm round-trip RPC cho dashboard/SDK.                                |

---

## 42. getCoSignPolicy

> _**Mục tiêu:** Trả policy co-sign theo `tenantId + docType` dưới dạng tuple decode ổn định. Hàm này hiện nằm trong `VoucherProtocolReader`._

_Code_

```solidity
function getCoSignPolicy(bytes32 tenantId, uint32 docType)
    external
    view
    returns (
        bool enabled,
        uint256 minStake,
        uint256 minSigners,
        uint256 requiredRoleMask
    )
{
    VoucherProtocol.CoSignPolicy memory policy = protocol.getCoSignPolicyStruct(tenantId, docType);
    return (policy.enabled, policy.minStake, policy.minSigners, policy.requiredRoleMask);
}
```

_Giải thích_

| **Thành phần**          | **Ý nghĩa kỹ thuật**                                     |
| ----------------------- | -------------------------------------------------------- |
| **enabled**             | Cho biết policy co-sign đang bật hay tắt cho docType đó. |
| **minStake/minSigners** | Hai ngưỡng quorum kinh tế/số lượng signer trusted.       |
| **requiredRoleMask**    | Mặt nạ vai trò bắt buộc để đạt qualified.                |

---

## 43. getCoSignOperatorConfig

> _**Mục tiêu:** Trả cấu hình co-sign của một operator theo `tenantId + docType`. Hàm này hiện nằm trong `VoucherProtocolReader`._

_Code_

```solidity
function getCoSignOperatorConfig(bytes32 tenantId, uint32 docType, address operator)
    external
    view
    returns (bool whitelisted, uint16 roleId)
{
    return (
        protocol.tenantCoSignWhitelisted(tenantId, docType, operator),
        protocol.tenantCoSignRoles(tenantId, docType, operator)
    );
}
```

_Giải thích_

| **Thành phần**  | **Ý nghĩa kỹ thuật**                                             |
| --------------- | ---------------------------------------------------------------- |
| **whitelisted** | Operator có được phép tham gia co-sign cho docType đó hay không. |
| **roleId**      | Vai trò hiện tại của operator trong policy co-sign.              |

---

## 44. getTenantRuntimeConfig

> _**Mục tiêu:** Trả cấu hình runtime cốt lõi của tenant để client áp dụng rule local. Hàm này hiện nằm trong `VoucherProtocolReader`._

_Code_

```solidity
function getTenantRuntimeConfig(bytes32 tenantId)
    external
    view
    returns (uint256 minOperatorStake, uint256 unstakeCooldown)
{
    return (
        protocol.tenantMinOperatorStake(tenantId),
        protocol.tenantUnstakeCooldown(tenantId)
    );
}
```

_Giải thích_

| **Thành phần**       | **Ý nghĩa kỹ thuật**                          |
| -------------------- | --------------------------------------------- |
| **minOperatorStake** | Ngưỡng stake tối thiểu hiện hành của tenant.  |
| **unstakeCooldown**  | Thời gian chờ rút stake hiện hành của tenant. |

---

## 45. getViolationPenalty

> _**Mục tiêu:** Trả mức phạt (BPS) đã cấu hình cho một mã vi phạm trong tenant. Hàm này hiện nằm trong `VoucherProtocolReader`._

_Code_

```solidity
function getViolationPenalty(bytes32 tenantId, bytes32 violationCode) external view returns (uint16 penaltyBps) {
    return protocol.tenantViolationPenalties(tenantId, violationCode);
}
```

_Giải thích_

| **Thành phần**    | **Ý nghĩa kỹ thuật**                              |
| ----------------- | ------------------------------------------------- |
| **violationCode** | Mã vi phạm dùng để map sang penalty cụ thể.       |
| **penaltyBps**    | Mức phạt basis points đang hiệu lực trong tenant. |

---

## 46-51. Nhóm getter hỗ trợ cho `VoucherProtocolReader`

> _**Mục tiêu:** Cung cấp các primitive getter nhỏ gọn trong `VoucherProtocol` để `VoucherProtocolReader` tổng hợp thành các API đọc có cấu trúc mà vẫn giữ bytecode của contract core ở mức deployable._

_Code_

```solidity
function getDocument(bytes32 tenantId, bytes32 fileHash) external view returns (Document memory) {
    return documents[tenantId][fileHash];
}

function getCoSignPolicyStruct(bytes32 tenantId, uint32 docType) external view returns (CoSignPolicy memory) {
    return tenantCoSignPolicies[tenantId][docType];
}

function getTenantStruct(bytes32 tenantId) external view returns (Tenant memory) {
    return tenants[tenantId];
}

function getOperatorStruct(bytes32 tenantId, address operator) external view returns (Operator memory) {
    return operators[tenantId][operator];
}

function getTenantListLength() external view returns (uint256) {
    return tenantList.length;
}

function getTenantAtIndex(uint256 index) external view returns (bytes32) {
    return tenantList[index];
}
```

_Giải thích_

| **Getter**                | **Ý nghĩa kỹ thuật**                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **getDocument**           | Trả nguyên struct `Document` để Reader dùng cho `verify`, `getDocumentOrRevert`, `getDocumentStatus`, `getCoSignStatus`. |
| **getCoSignPolicyStruct** | Trả nguyên struct `CoSignPolicy` để Reader không phải dựng lại nhiều lời gọi nhỏ.                                        |
| **getTenantStruct**       | Trả snapshot tenant phục vụ `getTenantInfo`.                                                                             |
| **getOperatorStruct**     | Trả snapshot operator phục vụ `getOperatorStatus`.                                                                       |
| **getTenantListLength**   | Cho Reader biết tổng số tenant mà không cần truy cập trực tiếp mảng storage.                                             |
| **getTenantAtIndex**      | Cho Reader paginate danh sách `tenantId` theo index.                                                                     |

---

## Tham khảo

- [REPORT](./REPORT.md) - Báo cáo tổng hợp design & roadmap.
- [DOCUMENTATION](./DOCUMENTATION.md) - Giải thích tổng quan các khải niệm kèm theo tài liệu tham khảo chi tiết
