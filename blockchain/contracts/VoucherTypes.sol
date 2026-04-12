// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library VoucherTypes {
    struct Tenant {
        address admin;
        address operatorManager;
        address treasury;
        bool isActive;
        uint256 createdAt;
    }

    struct Operator {
        bytes32 tenantId;
        address walletAddress;
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

    struct TenantConfig {
        address admin;
        address slasher;
        address operatorManager;
        uint256 minStake;
        uint256 unstakeCooldown;
    }

    // ---- Aggregated protocol storage (passed by reference to external libraries) ----
    struct VoucherStorage {
        // Tenant registry
        mapping(bytes32 => Tenant) tenants;
        bytes32[] tenantList;

        // Operator state per tenant
        mapping(bytes32 => mapping(address => Operator)) operators;
        mapping(bytes32 => address[]) operatorList;
        mapping(bytes32 => mapping(address => bool)) isOperatorListed;
        mapping(bytes32 => mapping(address => uint256)) nonces;
        mapping(bytes32 => mapping(address => uint256)) pendingUnstakeAt;
        mapping(bytes32 => mapping(address => address)) recoveryDelegates;
        mapping(bytes32 => mapping(address => address)) recoveredFrom;
        mapping(bytes32 => mapping(address => address)) recoveredTo;

        // Document state per tenant
        mapping(bytes32 => mapping(bytes32 => Document)) documents;
        mapping(bytes32 => mapping(bytes32 => mapping(address => bool))) documentSigners;
        mapping(bytes32 => mapping(bytes32 => uint256)) coSignCount;
        mapping(bytes32 => mapping(bytes32 => uint256)) trustedCoSignCount;
        mapping(bytes32 => mapping(bytes32 => uint256)) trustedCoSignRoleMask;
        mapping(bytes32 => mapping(bytes32 => bool)) coSignQualified;

        // Co-sign governance per tenant
        mapping(bytes32 => mapping(uint32 => CoSignPolicy)) tenantCoSignPolicies;
        mapping(bytes32 => mapping(uint32 => mapping(address => bool))) tenantCoSignWhitelisted;
        mapping(bytes32 => mapping(uint32 => mapping(address => uint16))) tenantCoSignRoles;
        mapping(bytes32 => mapping(bytes32 => uint16)) tenantViolationPenalties;
        mapping(bytes32 => uint256) tenantMinOperatorStake;
        mapping(bytes32 => uint256) tenantUnstakeCooldown;
    }
}