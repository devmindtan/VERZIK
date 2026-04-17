// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IVoucherProtocolErrorsEvents {
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
    error CannotSlashYourself();
    error ProtocolAdminCannotHaveOtherRoles();
    error InvalidOperatorAddress();
    error TenantRoleConflict();

    event ProtocolInitialized(address indexed protocolOwner);
    event TenantCreated(
        bytes32 indexed tenantId, 
        address indexed admin, 
        address indexed manager,
        address treasury
    );
    
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
    event OperatorRecoveryAliasUpdated(bytes32 indexed tenantId, address indexed oldOperator, address indexed newOperator, address rootOperator);
    event TreasuryUpdated(bytes32 indexed tenantId, address indexed oldTreasury, address indexed newTreasury);
    event ViolationPenaltyUpdated(bytes32 indexed tenantId, bytes32 indexed violationCode, uint16 oldPenaltyBps, uint16 newPenaltyBps);

    event DocumentAnchored(
        bytes32 indexed tenantId,
        bytes32 indexed fileHash,
        address owner,
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
}