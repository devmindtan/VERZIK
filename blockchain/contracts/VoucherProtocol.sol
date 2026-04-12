// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IVoucherProtocolErrorsEvents.sol";
import "./VoucherTypes.sol";
import "./VoucherProtocolHelper.sol";
import "./OperatorLib.sol";
import "./DocumentLib.sol";
import "./CoSignLib.sol";
import "./RecoveryLib.sol";

/**
 * @title VoucherProtocol
 * @notice Thin orchestrator contract. All heavy business logic lives in external
 *         libraries (OperatorLib, DocumentLib, CoSignLib, RecoveryLib) which are
 *         called via delegatecall, keeping this contract's bytecode well under the
 *         24 576-byte Spurious Dragon deployment limit.
 */
contract VoucherProtocol is ReentrancyGuard, AccessControl, IVoucherProtocolErrorsEvents, VoucherProtocolHelper {
    // --- CONSTANTS ---
    address public protocolOwner;
    bytes32 public constant PROTOCOL_ADMIN_ROLE = keccak256("PROTOCOL_ADMIN_ROLE");

    uint16 public constant COSIGN_ROLE_NONE = 0;
    uint16 public constant MIN_COSIGN_ROLE_ID = 1;
    uint16 public constant MAX_COSIGN_ROLE_ID = 256;
    uint16 public constant MAX_PENALTY_BPS = 10_000;
    uint256 public constant MIN_STAKE = 0.1 ether;
    uint256 public constant UNSTAKE_COOLDOWN = 1 days;

    // --- EIP-712 ---
    bytes32 private immutable DOMAIN_SEPARATOR;

    // --- ALL PROTOCOL STATE (passed by reference to external libraries) ---
    VoucherTypes.VoucherStorage internal _s;

    /**
     * @notice Khởi tạo protocol-level owner và domain EIP-712 dùng chung cho mọi tenant.
     */
    constructor() {
        protocolOwner = msg.sender;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PROTOCOL_ADMIN_ROLE, msg.sender);

        DOMAIN_SEPARATOR = keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256("VoucherProtocol"),
            keccak256("1"),
            block.chainid,
            address(this)
        ));

        emit ProtocolInitialized(msg.sender);
    }

    // ---- TENANT MANAGEMENT ----

    /**
     * @notice Tạo tenant mới với admin, treasury và bộ config mặc định độc lập.
     */
    function createTenant(
        bytes32 tenantId,
        address tenantTreasury,
        VoucherTypes.TenantConfig calldata config
    ) external onlyRole(PROTOCOL_ADMIN_ROLE) {
        if (tenantId == bytes32(0)) revert InvalidConfigValue();
        if (config.admin == address(0) || tenantTreasury == address(0)) revert InvalidTenantAddress();
        if (config.operatorManager == address(0)) revert InvalidTenantAddress();
        _ensureNotProtocolAdmin(config.admin);
        _ensureNotProtocolAdmin(config.operatorManager);
        _ensureNotProtocolAdmin(tenantTreasury);
        _ensureNoTenantRoleCollisionOnCreate(config.admin, config.operatorManager, tenantTreasury);
        if (config.minStake == 0) revert InvalidConfigValue();
        if (config.unstakeCooldown == 0) revert InvalidConfigValue();
        if (_s.tenants[tenantId].admin != address(0)) revert TenantAlreadyExists();

        _s.tenants[tenantId] = VoucherTypes.Tenant({
            admin: config.admin,
            operatorManager: config.operatorManager,
            treasury: tenantTreasury,
            isActive: true,
            createdAt: block.timestamp
        });
        _s.tenantList.push(tenantId);

        bytes32 tenantAdminRole = _getTenantAdminRole(tenantId);
        bytes32 tenantOperatorManagerRole = _getTenantOperatorManagerRole(tenantId);

        _registerTenantRole(tenantAdminRole, tenantId, TENANT_ROLE_ADMIN);
        _registerTenantRole(tenantOperatorManagerRole, tenantId, TENANT_ROLE_OPERATOR_MANAGER);

        _grantRole(tenantAdminRole, config.admin);
        _grantRole(tenantOperatorManagerRole, config.operatorManager);

        _setRoleAdmin(tenantAdminRole, tenantAdminRole);
        _setRoleAdmin(tenantOperatorManagerRole, tenantAdminRole);

        _s.tenantMinOperatorStake[tenantId] = config.minStake;
        _s.tenantUnstakeCooldown[tenantId] = config.unstakeCooldown;

        emit TenantCreated(tenantId, config.admin, tenantTreasury);
    }

    /**
     * @notice Bật/tắt tenant ở tầng protocol.
     */
    function setTenantStatus(bytes32 tenantId, bool isActive) external onlyRole(PROTOCOL_ADMIN_ROLE) {
        if (_s.tenants[tenantId].admin == address(0)) revert TenantNotFound();
        _s.tenants[tenantId].isActive = isActive;
        emit TenantStatusUpdated(tenantId, isActive);
    }

    // ---- OPERATOR MANAGEMENT (delegated to OperatorLib) ----

    function joinAsOperator(bytes32 tenantId, string calldata _metadataURI) external payable {
        OperatorLib.joinAsOperator(_s, tenantId, _metadataURI);
    }

    function topUpStake(bytes32 tenantId) external payable {
        OperatorLib.topUpStake(_s, tenantId);
    }

    function updateOperatorMetadata(bytes32 tenantId, string calldata metadataURI) external {
        OperatorLib.updateOperatorMetadata(_s, tenantId, metadataURI);
    }

    function requestUnstake(bytes32 tenantId) external {
        OperatorLib.requestUnstake(_s, tenantId);
    }

    function executeUnstake(bytes32 tenantId) external nonReentrant {
        OperatorLib.executeUnstake(_s, tenantId);
    }

    function setOperatorStatus(
        bytes32 tenantId,
        address operator,
        bool isActive,
        string calldata reason
    ) external {
        OperatorLib.setOperatorStatus(_s, tenantId, operator, isActive, reason);
    }

    function setTreasury(bytes32 tenantId, address newTreasury) external {
        OperatorLib.setTreasury(_s, tenantId, newTreasury);
    }

    function slashOperator(bytes32 tenantId, address _operator, string calldata reason) external nonReentrant {
        OperatorLib.slashOperator(_s, tenantId, _operator, reason);
    }

    function softSlashOperator(
        bytes32 tenantId,
        address _operator,
        bytes32 violationCode,
        string calldata reason
    ) external nonReentrant {
        OperatorLib.softSlashOperator(_s, tenantId, _operator, violationCode, reason);
    }

    function setMinOperatorStake(bytes32 tenantId, uint256 newMinOperatorStake) external {
        OperatorLib.setMinOperatorStake(_s, tenantId, newMinOperatorStake);
    }

    function setUnstakeCooldown(bytes32 tenantId, uint256 newUnstakeCooldown) external {
        OperatorLib.setUnstakeCooldown(_s, tenantId, newUnstakeCooldown);
    }

    function setViolationPenalty(bytes32 tenantId, bytes32 violationCode, uint16 penaltyBps) external {
        OperatorLib.setViolationPenalty(_s, tenantId, violationCode, penaltyBps);
    }

    // ---- DOCUMENT MANAGEMENT (delegated to DocumentLib) ----

    function registerWithSignature(
        VoucherTypes.RegisterPayload calldata payload,
        bytes calldata signature
    ) external nonReentrant {
        DocumentLib.registerWithSignature(_s, payload, signature, DOMAIN_SEPARATOR);
    }

    function revokeDocument(bytes32 tenantId, bytes32 fileHash, string calldata reason) external {
        DocumentLib.revokeDocument(_s, tenantId, fileHash, reason);
    }

    // ---- CO-SIGN MANAGEMENT (delegated to CoSignLib) ----

    function coSignDocumentWithSignature(
        VoucherTypes.CoSignPayload calldata payload,
        bytes calldata signature
    ) external nonReentrant {
        CoSignLib.coSignDocumentWithSignature(_s, payload, signature, DOMAIN_SEPARATOR);
    }

    function setCoSignPolicy(
        bytes32 tenantId,
        uint32 docType,
        bool enabled,
        uint256 minStake,
        uint256 minSigners,
        uint256 requiredRoleMask
    ) external {
        CoSignLib.setCoSignPolicy(_s, tenantId, docType, enabled, minStake, minSigners, requiredRoleMask);
    }

    function setCoSignOperator(
        bytes32 tenantId,
        uint32 docType,
        address operator,
        bool whitelisted,
        uint16 roleId
    ) external {
        CoSignLib.setCoSignOperator(_s, tenantId, docType, operator, whitelisted, roleId);
    }

    // ---- RECOVERY MANAGEMENT (delegated to RecoveryLib) ----

    function setRecoveryDelegate(bytes32 tenantId, address delegate) external {
        RecoveryLib.setRecoveryDelegate(_s, tenantId, delegate);
    }

    function recoverOperatorByDelegate(
        bytes32 tenantId,
        address lostOperator,
        string calldata reason
    ) external {
        RecoveryLib.recoverOperatorByDelegate(_s, tenantId, lostOperator, reason);
    }

    function recoverOperatorByAdmin(
        bytes32 tenantId,
        address lostOperator,
        address newOperator,
        string calldata reason
    ) external {
        RecoveryLib.recoverOperatorByAdmin(_s, tenantId, lostOperator, newOperator, reason);
    }

    // ---- ROLE MANAGEMENT ----

    /**
     * @notice Override grantRole để enforce tách biệt role governance trong từng tenant.
     */
    function grantRole(bytes32 role, address account)
        public
        override
        onlyRole(getRoleAdmin(role))
    {
        _enforceTenantRoleSegregationOnGrant(role, account);
        _grantRole(role, account);
    }

    // ---- ABSTRACT HOOK IMPLEMENTATIONS (required by VoucherProtocolHelper) ----

    function _protocolAdminRole() internal pure override returns (bytes32) {
        return PROTOCOL_ADMIN_ROLE;
    }

    function _hasRoleInternal(bytes32 role, address account) internal view override returns (bool) {
        return hasRole(role, account);
    }

    function _getTenantTreasury(bytes32 tenantId) internal view override returns (address) {
        return _s.tenants[tenantId].treasury;
    }

    // ---- VIEW GETTERS ----

    function getDocument(bytes32 tenantId, bytes32 fileHash)
        external view returns (VoucherTypes.Document memory)
    {
        return _s.documents[tenantId][fileHash];
    }

    function getCoSignPolicyStruct(bytes32 tenantId, uint32 docType)
        external view returns (VoucherTypes.CoSignPolicy memory)
    {
        return _s.tenantCoSignPolicies[tenantId][docType];
    }

    function getTenantStruct(bytes32 tenantId)
        external view returns (VoucherTypes.Tenant memory)
    {
        return _s.tenants[tenantId];
    }

    function getOperatorStruct(bytes32 tenantId, address operator)
        external view returns (VoucherTypes.Operator memory)
    {
        return _s.operators[tenantId][operator];
    }

    function getTenantListLength() external view returns (uint256) {
        return _s.tenantList.length;
    }

    function getTenantAtIndex(uint256 index) external view returns (bytes32) {
        return _s.tenantList[index];
    }

    function getOperatorListLength(bytes32 tenantId) external view returns (uint256) {
        return _s.operatorList[tenantId].length;
    }

    function getOperatorAtIndex(bytes32 tenantId, uint256 index) external view returns (address) {
        return _s.operatorList[tenantId][index];
    }

    function getRecoveryAlias(bytes32 tenantId, address operator)
        external view returns (address rootOperator, address replacedBy)
    {
        return (_s.recoveredFrom[tenantId][operator], _s.recoveredTo[tenantId][operator]);
    }

    function getNonce(bytes32 tenantId, address operator) external view returns (uint256) {
        return _s.nonces[tenantId][operator];
    }

    function getPendingUnstakeAt(bytes32 tenantId, address operator) external view returns (uint256) {
        return _s.pendingUnstakeAt[tenantId][operator];
    }

    function getCoSignStatus(bytes32 tenantId, bytes32 fileHash)
        external view returns (
            uint256 count,
            uint256 trustedCount,
            uint256 roleMask,
            bool qualified
        )
    {
        return (
            _s.coSignCount[tenantId][fileHash],
            _s.trustedCoSignCount[tenantId][fileHash],
            _s.trustedCoSignRoleMask[tenantId][fileHash],
            _s.coSignQualified[tenantId][fileHash]
        );
    }

    function getTenantConfig(bytes32 tenantId)
        external view returns (uint256 minStake, uint256 cooldown)
    {
        return (_s.tenantMinOperatorStake[tenantId], _s.tenantUnstakeCooldown[tenantId]);
    }

    // Backward-compatible auto-getter replacements for state now inside _s
    function nonces(bytes32 tenantId, address operator) external view returns (uint256) {
        return _s.nonces[tenantId][operator];
    }

    function pendingUnstakeAt(bytes32 tenantId, address operator) external view returns (uint256) {
        return _s.pendingUnstakeAt[tenantId][operator];
    }

    function recoveryDelegates(bytes32 tenantId, address operator) external view returns (address) {
        return _s.recoveryDelegates[tenantId][operator];
    }

    function documentSigners(bytes32 tenantId, bytes32 fileHash, address signer) external view returns (bool) {
        return _s.documentSigners[tenantId][fileHash][signer];
    }

    function coSignCount(bytes32 tenantId, bytes32 fileHash) external view returns (uint256) {
        return _s.coSignCount[tenantId][fileHash];
    }

    function trustedCoSignCount(bytes32 tenantId, bytes32 fileHash) external view returns (uint256) {
        return _s.trustedCoSignCount[tenantId][fileHash];
    }

    function trustedCoSignRoleMask(bytes32 tenantId, bytes32 fileHash) external view returns (uint256) {
        return _s.trustedCoSignRoleMask[tenantId][fileHash];
    }

    function coSignQualified(bytes32 tenantId, bytes32 fileHash) external view returns (bool) {
        return _s.coSignQualified[tenantId][fileHash];
    }

    function tenantCoSignWhitelisted(bytes32 tenantId, uint32 docType, address operator) external view returns (bool) {
        return _s.tenantCoSignWhitelisted[tenantId][docType][operator];
    }

    function tenantCoSignRoles(bytes32 tenantId, uint32 docType, address operator) external view returns (uint16) {
        return _s.tenantCoSignRoles[tenantId][docType][operator];
    }

    function tenantMinOperatorStake(bytes32 tenantId) external view returns (uint256) {
        return _s.tenantMinOperatorStake[tenantId];
    }

    function tenantUnstakeCooldown(bytes32 tenantId) external view returns (uint256) {
        return _s.tenantUnstakeCooldown[tenantId];
    }

    function tenantViolationPenalties(bytes32 tenantId, bytes32 violationCode) external view returns (uint16) {
        return _s.tenantViolationPenalties[tenantId][violationCode];
    }
}

