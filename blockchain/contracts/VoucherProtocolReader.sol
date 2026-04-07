// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./VoucherProtocol.sol";

/**
 * @notice Reader contract để truy vấn state của VoucherProtocol mà không tăng bytecode.
 */
contract VoucherProtocolReader {
    VoucherProtocol public protocol;

    constructor(address _protocol) {
        protocol = VoucherProtocol(_protocol);
    }

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

    function getDocumentOrRevert(bytes32 tenantId, bytes32 fileHash)
        external
        view
        returns (VoucherProtocol.Document memory)
    {
        VoucherProtocol.Document memory doc = protocol.getDocument(tenantId, fileHash);
        if (doc.issuer == address(0)) revert VoucherProtocol.DocumentNotFound();
        return doc;
    }

    function hasSignedDocument(bytes32 tenantId, bytes32 fileHash, address signer)
        external
        view
        returns (bool)
    {
        return protocol.documentSigners(tenantId, fileHash, signer);
    }

    function isDocumentCoSignQualified(bytes32 tenantId, bytes32 fileHash)
        external
        view
        returns (bool)
    {
        return protocol.coSignQualified(tenantId, fileHash);
    }

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

    function getTenantIds(uint256 offset, uint256 limit)
        external
        view
        returns (bytes32[] memory ids)
    {
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

    function getTenantCount() external view returns (uint256) {
        return protocol.getTenantListLength();
    }

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

    function getViolationPenalty(bytes32 tenantId, bytes32 violationCode)
        external
        view
        returns (uint16 penaltyBps)
    {
        return protocol.tenantViolationPenalties(tenantId, violationCode);
    }
}
