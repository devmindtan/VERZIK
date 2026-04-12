// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/IAccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./VoucherTypes.sol";
import "./IVoucherProtocolErrorsEvents.sol";

/**
 * @title DocumentLib
 * @notice External library handling document registration and revocation.
 *         Called via delegatecall from VoucherProtocol, reducing its bytecode size.
 */
library DocumentLib {
    using ECDSA for bytes32;

    bytes32 private constant PROTOCOL_ADMIN_ROLE = keccak256("PROTOCOL_ADMIN_ROLE");
    bytes32 private constant REGISTER_TYPEHASH = keccak256(
        "Register(bytes32 tenantId,bytes32 fileHash,string cid,bytes32 ciphertextHash,bytes32 encryptionMetaHash,uint32 docType,uint32 version,uint256 nonce,uint256 deadline)"
    );
    uint16 private constant MIN_COSIGN_ROLE_ID = 1;
    uint16 private constant MAX_COSIGN_ROLE_ID = 256;

    // --- PRIVATE HELPERS ---

    function _adminRole(bytes32 tenantId) private pure returns (bytes32) {
        return keccak256(abi.encode("TENANT_ADMIN_ROLE", tenantId));
    }

    function _hasRole(bytes32 role, address account) private view returns (bool) {
        return IAccessControl(address(this)).hasRole(role, account);
    }

    function _ensureNotProtocolAdmin(address account) private view {
        if (_hasRole(PROTOCOL_ADMIN_ROLE, account))
            revert IVoucherProtocolErrorsEvents.ProtocolAdminCannotHaveOtherRoles();
    }

    function _roleToMask(uint16 roleId) private pure returns (uint256) {
        return uint256(1) << (roleId - 1);
    }

    function _recoverSigner(
        VoucherTypes.RegisterPayload calldata payload,
        bytes calldata signature,
        bytes32 domainSeparator
    ) private pure returns (address signer) {
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
        bytes32 digest = MessageHashUtils.toTypedDataHash(domainSeparator, structHash);
        signer = digest.recover(signature);
        if (signer == address(0)) revert IVoucherProtocolErrorsEvents.InvalidSignature();
    }

    function _evaluateCoSignQualification(
        VoucherTypes.VoucherStorage storage $,
        bytes32 tenantId,
        bytes32 fileHash,
        uint32 docType
    ) private {
        if ($.coSignQualified[tenantId][fileHash]) return;

        VoucherTypes.CoSignPolicy memory policy = $.tenantCoSignPolicies[tenantId][docType];
        if (!policy.enabled) {
            $.coSignQualified[tenantId][fileHash] = true;
            return;
        }

        bool meetsSignerThreshold = $.trustedCoSignCount[tenantId][fileHash] >= policy.minSigners;
        bool meetsRoleMask = (
            $.trustedCoSignRoleMask[tenantId][fileHash] & policy.requiredRoleMask
        ) == policy.requiredRoleMask;

        if (meetsSignerThreshold && meetsRoleMask) {
            $.coSignQualified[tenantId][fileHash] = true;
            emit IVoucherProtocolErrorsEvents.DocumentCoSignQualified(
                tenantId,
                fileHash,
                $.trustedCoSignCount[tenantId][fileHash],
                $.trustedCoSignRoleMask[tenantId][fileHash]
            );
        }
    }

    // --- EXTERNAL FUNCTIONS ---

    function registerWithSignature(
        VoucherTypes.VoucherStorage storage $,
        VoucherTypes.RegisterPayload calldata payload,
        bytes calldata signature,
        bytes32 domainSeparator
    ) external {
        if ($.tenants[payload.tenantId].admin == address(0)) revert IVoucherProtocolErrorsEvents.TenantNotFound();
        if (!$.tenants[payload.tenantId].isActive) revert IVoucherProtocolErrorsEvents.TenantInactive();
        if (block.timestamp > payload.deadline) revert IVoucherProtocolErrorsEvents.ExpiredSignature();
        if ($.documents[payload.tenantId][payload.fileHash].issuer != address(0))
            revert IVoucherProtocolErrorsEvents.DocumentAlreadyExists();

        address signer = _recoverSigner(payload, signature, domainSeparator);
        _ensureNotProtocolAdmin(signer);
        if ($.operators[payload.tenantId][signer].stakeAmount == 0)
            revert IVoucherProtocolErrorsEvents.OperatorNotInTenant();
        if (!$.operators[payload.tenantId][signer].isActive)
            revert IVoucherProtocolErrorsEvents.OperatorNotActive();
        if ($.nonces[payload.tenantId][signer] != payload.nonce)
            revert IVoucherProtocolErrorsEvents.InvalidSignature();

        $.documents[payload.tenantId][payload.fileHash] = VoucherTypes.Document({
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

        $.documentSigners[payload.tenantId][payload.fileHash][signer] = true;
        $.coSignCount[payload.tenantId][payload.fileHash] = 1;

        VoucherTypes.CoSignPolicy memory policy = $.tenantCoSignPolicies[payload.tenantId][payload.docType];
        if (!policy.enabled) {
            $.coSignQualified[payload.tenantId][payload.fileHash] = true;
        } else if (
            $.tenantCoSignWhitelisted[payload.tenantId][payload.docType][signer] &&
            $.operators[payload.tenantId][signer].stakeAmount >= policy.minStake
        ) {
            uint16 roleId = $.tenantCoSignRoles[payload.tenantId][payload.docType][signer];
            if (roleId >= MIN_COSIGN_ROLE_ID && roleId <= MAX_COSIGN_ROLE_ID) {
                $.trustedCoSignCount[payload.tenantId][payload.fileHash] = 1;
                $.trustedCoSignRoleMask[payload.tenantId][payload.fileHash] = _roleToMask(roleId);
                _evaluateCoSignQualification($, payload.tenantId, payload.fileHash, payload.docType);
            }
        }

        $.nonces[payload.tenantId][signer] = payload.nonce + 1;

        emit IVoucherProtocolErrorsEvents.NonceConsumed(
            payload.tenantId, signer, payload.nonce, payload.nonce + 1
        );
        emit IVoucherProtocolErrorsEvents.DocumentAnchored(
            payload.tenantId, payload.fileHash, payload.cid, signer,
            payload.ciphertextHash, payload.encryptionMetaHash, payload.docType, payload.version
        );
        emit IVoucherProtocolErrorsEvents.DocumentCoSigned(payload.tenantId, payload.fileHash, signer, 1);
    }

    function revokeDocument(
        VoucherTypes.VoucherStorage storage $,
        bytes32 tenantId,
        bytes32 fileHash,
        string calldata reason
    ) external {
        VoucherTypes.Document storage doc = $.documents[tenantId][fileHash];
        if (doc.issuer == address(0)) revert IVoucherProtocolErrorsEvents.DocumentNotFound();
        if (!_hasRole(_adminRole(tenantId), msg.sender) && msg.sender != doc.issuer)
            revert IVoucherProtocolErrorsEvents.Unauthorized();
        if (!doc.isValid) revert IVoucherProtocolErrorsEvents.DocumentAlreadyRevoked();

        doc.isValid = false;
        emit IVoucherProtocolErrorsEvents.DocumentRevoked(tenantId, fileHash, msg.sender, reason);
    }
}
