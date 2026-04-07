// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract VoucherProtocol is ReentrancyGuard, AccessControl {
    using ECDSA for bytes32;

    error Unauthorized();
    error TenantNotFound();
    error TenantAlreadyExists();
    error TenantInactive();
    error InvalidTenantAddress();
    error InsufficientStake(uint256 sent, uint256 required);
    error OperatorNotActive();
    error OperatorAlreadyActive();
    error OperatorNotInTenant();
    error DocumentAlreadyExists();
    error DocumentNotFound();
    error DocumentAlreadyRevoked();
    error InvalidSignature();
    error ExpiredSignature();
    error NoStake();
    error NoPendingUnstake();
    error UnstakeNotReady(uint256 readyAt);
    error EthTransferFailed();
    error InvalidRecoveryTarget();
    error RecoveryNotAllowed();
    error DocumentNotValid();
    error AlreadyCoSigned();
    error InvalidCoSignPolicy();
    error CoSignerNotWhitelisted();
    error InsufficientCoSignStake(uint256 currentStake, uint256 requiredStake);
    error InvalidCoSignRole();
    error InvalidConfigValue();
    error NoStakeToRecover();
    error UnstakeInProgress();
    error OperatorNotLost();
    error InvalidPenaltyBps(uint16 provided);
    error PenaltyNotConfigured(bytes32 violationCode);

    // --- CẤU TRÚC DỮ LIỆU ---
    struct Tenant {
        address admin;
        address treasury;
        bool isActive;
        uint256 createdAt;
    }

    struct Operator {
        bytes32 tenantId;
        string metadataURI;
        uint256 stakeAmount;
        bool isActive;
    }

    struct Document {
        bytes32 tenantId;
        string cid;
        address issuer;
        uint256 timestamp;
        bool isValid;
        bytes32 ciphertextHash;
        bytes32 encryptionMetaHash;
        uint32 docType;
        uint32 version;
    }

    struct RegisterPayload {
        bytes32 tenantId;
        bytes32 fileHash;
        string cid;
        bytes32 ciphertextHash;
        bytes32 encryptionMetaHash;
        uint32 docType;
        uint32 version;
        uint256 nonce;
        uint256 deadline;
    }

    struct CoSignPayload {
        bytes32 tenantId;
        bytes32 fileHash;
        uint256 nonce;
        uint256 deadline;
    }

    struct CoSignPolicy {
        bool enabled;
        uint256 minStake;
        uint256 minSigners;
        uint256 requiredRoleMask;
    }

    struct DocumentSnapshot {
        bool exists;
        bool isValid;
        address issuer;
        string cid;
        uint256 timestamp;
        bytes32 ciphertextHash;
        bytes32 encryptionMetaHash;
        uint32 docType;
        uint32 version;
        uint256 coSignCount;
        uint256 trustedCoSignCount;
        uint256 trustedCoSignRoleMask;
        bool coSignQualified;
    }

    // --- TRẠNG THÁI TOÀN CẦU ---
    address public protocolOwner;

    bytes32 public constant PROTOCOL_ADMIN_ROLE = keccak256("PROTOCOL_ADMIN_ROLE");

    uint16 public constant COSIGN_ROLE_NONE = 0;
    uint16 public constant MIN_COSIGN_ROLE_ID = 1;
    uint16 public constant MAX_COSIGN_ROLE_ID = 256;
    uint16 public constant MAX_PENALTY_BPS = 10_000;

    uint256 public constant MIN_STAKE = 0.1 ether;
    uint256 public constant UNSTAKE_COOLDOWN = 1 days;

    // Registry tenant toàn cục.
    mapping(bytes32 => Tenant) public tenants;
    bytes32[] public tenantList;

    // Operator state theo tenant.
    mapping(bytes32 => mapping(address => Operator)) public operators;
    mapping(bytes32 => mapping(address => uint256)) public nonces;
    mapping(bytes32 => mapping(address => uint256)) public pendingUnstakeAt;
    mapping(bytes32 => mapping(address => address)) public recoveryDelegates;

    // Document state theo tenant.
    mapping(bytes32 => mapping(bytes32 => Document)) public documents;
    mapping(bytes32 => mapping(bytes32 => mapping(address => bool))) public documentSigners;
    mapping(bytes32 => mapping(bytes32 => uint256)) public coSignCount;
    mapping(bytes32 => mapping(bytes32 => uint256)) public trustedCoSignCount;
    mapping(bytes32 => mapping(bytes32 => uint256)) public trustedCoSignRoleMask;
    mapping(bytes32 => mapping(bytes32 => bool)) public coSignQualified;

    // Governance config theo tenant.
    mapping(bytes32 => mapping(uint32 => CoSignPolicy)) public tenantCoSignPolicies;
    mapping(bytes32 => mapping(uint32 => mapping(address => bool))) public tenantCoSignWhitelisted;
    mapping(bytes32 => mapping(uint32 => mapping(address => uint16))) public tenantCoSignRoles;
    mapping(bytes32 => mapping(bytes32 => uint16)) public tenantViolationPenalties;
    mapping(bytes32 => uint256) public tenantMinOperatorStake;
    mapping(bytes32 => uint256) public tenantUnstakeCooldown;

    // --- EIP-712 ---
    bytes32 private constant REGISTER_TYPEHASH = keccak256(
        "Register(bytes32 tenantId,bytes32 fileHash,string cid,bytes32 ciphertextHash,bytes32 encryptionMetaHash,uint32 docType,uint32 version,uint256 nonce,uint256 deadline)"
    );
    bytes32 private constant COSIGN_TYPEHASH = keccak256(
        "CoSign(bytes32 tenantId,bytes32 fileHash,uint256 nonce,uint256 deadline)"
    );
    bytes32 private immutable DOMAIN_SEPARATOR;

    // --- SỰ KIỆN ---
    event ProtocolInitialized(address indexed protocolOwner);
    event TenantCreated(bytes32 indexed tenantId, address indexed admin, address indexed treasury);
    event TenantStatusUpdated(bytes32 indexed tenantId, bool isActive);

    event OperatorJoined(bytes32 indexed tenantId, address indexed operator, string metadata, uint256 stake);
    event OperatorMetadataUpdated(bytes32 indexed tenantId, address indexed operator, string metadataURI);
    event OperatorStatusUpdated(bytes32 indexed tenantId, address indexed operator, bool isActive, string reason);
    event OperatorStakeToppedUp(bytes32 indexed tenantId, address indexed operator, uint256 amount, uint256 totalStake);
    event OperatorUnstakeRequested(bytes32 indexed tenantId, address indexed operator, uint256 availableAt);
    event OperatorUnstaked(bytes32 indexed tenantId, address indexed operator, uint256 amount);
    event OperatorSlashed(bytes32 indexed tenantId, address indexed operator, uint256 amount, address indexed slasher, string reason);
    event OperatorSoftSlashed(
        bytes32 indexed tenantId,
        address indexed operator,
        bytes32 indexed violationCode,
        uint16 penaltyBps,
        uint256 slashedAmount,
        uint256 remainingStake,
        address slasher,
        string reason
    );
    event OperatorRecoveryDelegateUpdated(bytes32 indexed tenantId, address indexed operator, address indexed delegate);
    event OperatorRecovered(bytes32 indexed tenantId, address indexed oldOperator, address indexed newOperator, uint256 stakeAmount, string reason);
    event TreasuryUpdated(bytes32 indexed tenantId, address indexed oldTreasury, address indexed newTreasury);
    event ViolationPenaltyUpdated(bytes32 indexed tenantId, bytes32 indexed violationCode, uint16 oldPenaltyBps, uint16 newPenaltyBps);

    event DocumentAnchored(
        bytes32 indexed tenantId,
        bytes32 indexed fileHash,
        string cid,
        address indexed issuer,
        bytes32 ciphertextHash,
        bytes32 encryptionMetaHash,
        uint32 docType,
        uint32 version
    );
    event DocumentRevoked(bytes32 indexed tenantId, bytes32 indexed fileHash, address indexed revoker, string reason);
    event NonceConsumed(bytes32 indexed tenantId, address indexed signer, uint256 oldNonce, uint256 newNonce);
    event DocumentCoSigned(bytes32 indexed tenantId, bytes32 indexed fileHash, address indexed signer, uint256 totalSigners);
    event CoSignPolicyUpdated(bytes32 indexed tenantId, uint32 indexed docType, bool enabled, uint256 minStake, uint256 minSigners, uint256 requiredRoleMask);
    event CoSignOperatorConfigured(bytes32 indexed tenantId, uint32 indexed docType, address indexed operator, bool whitelisted, uint16 roleId);
    event DocumentCoSignQualified(bytes32 indexed tenantId, bytes32 indexed fileHash, uint256 trustedSigners, uint256 roleMask);
    event MinOperatorStakeUpdated(bytes32 indexed tenantId, uint256 oldValue, uint256 newValue);
    event UnstakeCooldownUpdated(bytes32 indexed tenantId, uint256 oldValue, uint256 newValue);

    /**
     * @notice Khởi tạo protocol-level owner và domain EIP-712 dùng chung cho mọi tenant.
     */
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

    /**
     * @notice Tạo tenant mới với admin, treasury và bộ config mặc định độc lập.
     */
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

        // Tạo role admin động gắn riêng cho tenant này.
        bytes32 tenantAdminRole = _getTenantAdminRole(tenantId);
        // Tạo role slasher động gắn riêng cho tenant này.
        bytes32 tenantSlasherRole = _getTenantSlasherRole(tenantId);
        // Tạo role operator-manager động gắn riêng cho tenant này.
        bytes32 tenantOperatorManagerRole = _getTenantOperatorManagerRole(tenantId);

        // Cấp quyền admin tenant cho ví quản trị tenant.
        _grantRole(tenantAdminRole, tenantAdmin);
        // Cấp quyền slasher mặc định cho admin tenant.
        _grantRole(tenantSlasherRole, tenantAdmin);
        // Cấp quyền quản lý operator mặc định cho admin tenant.
        _grantRole(tenantOperatorManagerRole, tenantAdmin);

        // Khởi tạo stake tối thiểu mặc định cho tenant mới.
        tenantMinOperatorStake[tenantId] = MIN_STAKE;
        // Khởi tạo cooldown unstake mặc định cho tenant mới.
        tenantUnstakeCooldown[tenantId] = UNSTAKE_COOLDOWN;

        // Phát event để indexer ghi nhận tenant vừa được tạo.
        emit TenantCreated(tenantId, tenantAdmin, tenantTreasury);
    }

    /**
     * @notice Bật/tắt tenant ở tầng protocol.
     */
    function setTenantStatus(bytes32 tenantId, bool isActive) external onlyRole(PROTOCOL_ADMIN_ROLE) {
        // Tenant phải tồn tại trước khi cập nhật trạng thái.
        if (tenants[tenantId].admin == address(0)) revert TenantNotFound();
        // Ghi trạng thái active/inactive mới cho tenant.
        tenants[tenantId].isActive = isActive;
        // Phát event để các hệ downstream đồng bộ trạng thái tenant.
        emit TenantStatusUpdated(tenantId, isActive);
    }

    /**
     * @notice Tuyển dụng operator mới trong phạm vi một tenant.
     */
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

    /**
     * @notice Cho operator đang active nạp thêm stake trong tenant của mình.
     */
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

    /**
     * @notice Cập nhật metadata cho operator trong tenant tương ứng.
     */
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

    /**
     * @notice Tạo yêu cầu rút stake trong tenant tương ứng.
     */
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

    /**
     * @notice Thực thi rút stake sau khi cooldown hoàn tất.
     */
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

    /**
     * @notice Đăng ký tài liệu bằng chữ ký EIP-712 trong phạm vi tenant.
     */
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

    /**
     * @notice Recover signer từ payload anchor theo chuẩn EIP-712.
     */
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





    /**
     * @notice Thu hồi hiệu lực tài liệu bởi tenant admin hoặc issuer.
     */
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

    /**
     * @notice Quản lý trạng thái active/inactive của operator trong tenant.
     */
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

    /**
     * @notice Cập nhật treasury nhận tiền slash cho tenant.
     */
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

    /**
     * @notice Hard slash operator trong tenant và tịch thu 100% stake.
     */
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

    /**
     * @notice Thiết lập delegate khôi phục ví cho operator trong tenant.
     */
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

    /**
     * @notice Khôi phục operator bằng delegate đã đăng ký trước đó.
     */
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

    /**
     * @notice Khôi phục operator bằng quyền quản trị khẩn cấp của tenant.
     */
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

    /**
     * @notice Đồng ký tài liệu trong tenant bằng payload EIP-712 riêng.
     */
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

    /**
     * @notice Recover signer cho payload co-sign theo EIP-712.
     */
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




    /**
     * @notice Cấu hình chính sách co-sign theo docType cho từng tenant.
     */
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

    /**
     * @notice Cấu hình whitelist và role co-sign cho operator theo docType trong tenant.
     */
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





    /**
     * @notice Cấu hình stake tối thiểu cho operator trong từng tenant.
     */
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

    /**
     * @notice Cấu hình cooldown unstake cho từng tenant.
     */
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

    /**
     * @notice Cấu hình mức phạt theo mã vi phạm trong tenant.
     */
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

    /**
     * @notice Soft slash operator theo tỷ lệ cấu hình cho một violation code.
     */
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



















    /**
     * @notice Ép signer đạt đủ whitelist, stake và role theo co-sign policy.
     */
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

    /**
     * @notice Đánh giá lại cờ qualified của tài liệu theo policy hiện tại.
     */
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
            // Đánh dấu tài liệu đã qualified theo policy.
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

    /**
     * @notice Chuyển role id sang bitmask để check quorum role.
     */
    function _roleToMask(uint16 roleId) internal pure returns (uint256) {
        // Role bắt đầu từ 1 nên cần trừ 1 để map sang vị trí bit 0-based.
        return uint256(1) << (roleId - 1);
    }

    /**
     * @notice Sinh ra tenant admin role động từ tenantId.
     */
    function _getTenantAdminRole(bytes32 tenantId) internal pure returns (bytes32) {
        // Băm tên role với tenantId để tạo namespace role riêng cho tenant.
        return keccak256(abi.encode("TENANT_ADMIN_ROLE", tenantId));
    }

    /**
     * @notice Sinh ra tenant slasher role động từ tenantId.
     */
    function _getTenantSlasherRole(bytes32 tenantId) internal pure returns (bytes32) {
        // Băm tên role với tenantId để tạo slasher role riêng cho tenant.
        return keccak256(abi.encode("TENANT_SLASHER_ROLE", tenantId));
    }

    /**
     * @notice Sinh ra tenant operator-manager role động từ tenantId.
     */
    function _getTenantOperatorManagerRole(bytes32 tenantId) internal pure returns (bytes32) {
        // Băm tên role với tenantId để tạo operator-manager role riêng cho tenant.
        return keccak256(abi.encode("TENANT_OPERATOR_MANAGER_ROLE", tenantId));
    }

    // Getter functions for Reader contract
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
}
