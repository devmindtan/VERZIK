// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/IAccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./VoucherTypes.sol";
import "./IVoucherProtocolErrorsEvents.sol";

/**
 * @title CoSignLib
 * @notice External library handling co-sign logic and co-sign policy management.
 *         Called via delegatecall from VoucherProtocol, reducing its bytecode size.
 */
library CoSignLib {
    using ECDSA for bytes32;

    bytes32 private constant PROTOCOL_ADMIN_ROLE = keccak256("PROTOCOL_ADMIN_ROLE");
    bytes32 private constant COSIGN_TYPEHASH = keccak256(
        "CoSign(bytes32 tenantId,bytes32 fileHash,uint256 nonce,uint256 deadline)"
    );
    uint16 private constant MIN_COSIGN_ROLE_ID = 1;
    uint16 private constant MAX_COSIGN_ROLE_ID = 256;
    uint16 private constant COSIGN_ROLE_NONE = 0;

    // --- PRIVATE HELPERS ---

    function _opManagerRole(bytes32 tenantId) private pure returns (bytes32) {
        return keccak256(abi.encode("TENANT_OPERATOR_MANAGER_ROLE", tenantId));
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

    function _recoverCoSigner(
        VoucherTypes.CoSignPayload calldata payload,
        bytes calldata signature,
        bytes32 domainSeparator
    ) private pure returns (address signer) {
        bytes32 structHash = keccak256(abi.encode(
            COSIGN_TYPEHASH,
            payload.tenantId,
            payload.fileHash,
            payload.nonce,
            payload.deadline
        ));
        bytes32 digest = MessageHashUtils.toTypedDataHash(domainSeparator, structHash);
        signer = digest.recover(signature);
        if (signer == address(0)) revert IVoucherProtocolErrorsEvents.InvalidSignature();
    }

    function _enforceCoSignPolicy(
        VoucherTypes.VoucherStorage storage $,
        bytes32 tenantId,
        uint32 docType,
        address signer,
        uint256 requiredStake
    ) private view returns (uint256 roleMask) {
        if (!$.tenantCoSignWhitelisted[tenantId][docType][signer])
            revert IVoucherProtocolErrorsEvents.CoSignerNotWhitelisted();
        if ($.operators[tenantId][signer].stakeAmount < requiredStake)
            revert IVoucherProtocolErrorsEvents.InsufficientCoSignStake(
                $.operators[tenantId][signer].stakeAmount, requiredStake
            );

        uint16 roleId = $.tenantCoSignRoles[tenantId][docType][signer];
        if (roleId < MIN_COSIGN_ROLE_ID || roleId > MAX_COSIGN_ROLE_ID)
            revert IVoucherProtocolErrorsEvents.InvalidCoSignRole();

        roleMask = _roleToMask(roleId);
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

    function coSignDocumentWithSignature(
        VoucherTypes.VoucherStorage storage $,
        VoucherTypes.CoSignPayload calldata payload,
        bytes calldata signature,
        bytes32 domainSeparator
    ) external {
        if ($.tenants[payload.tenantId].admin == address(0)) revert IVoucherProtocolErrorsEvents.TenantNotFound();
        if (!$.tenants[payload.tenantId].isActive) revert IVoucherProtocolErrorsEvents.TenantInactive();
        if (block.timestamp > payload.deadline) revert IVoucherProtocolErrorsEvents.ExpiredSignature();

        VoucherTypes.Document memory doc = $.documents[payload.tenantId][payload.fileHash];
        if (doc.issuer == address(0)) revert IVoucherProtocolErrorsEvents.DocumentNotFound();
        if (!doc.isValid) revert IVoucherProtocolErrorsEvents.DocumentNotValid();

        address signer = _recoverCoSigner(payload, signature, domainSeparator);
        _ensureNotProtocolAdmin(signer);
        if ($.operators[payload.tenantId][signer].stakeAmount == 0)
            revert IVoucherProtocolErrorsEvents.OperatorNotInTenant();
        if (!$.operators[payload.tenantId][signer].isActive)
            revert IVoucherProtocolErrorsEvents.OperatorNotActive();
        if ($.nonces[payload.tenantId][signer] != payload.nonce)
            revert IVoucherProtocolErrorsEvents.InvalidSignature();
        if ($.documentSigners[payload.tenantId][payload.fileHash][signer])
            revert IVoucherProtocolErrorsEvents.AlreadyCoSigned();

        VoucherTypes.CoSignPolicy memory policy = $.tenantCoSignPolicies[payload.tenantId][doc.docType];
        uint256 roleMask = 0;
        if (policy.enabled) {
            roleMask = _enforceCoSignPolicy($, payload.tenantId, doc.docType, signer, policy.minStake);
        }

        $.documentSigners[payload.tenantId][payload.fileHash][signer] = true;
        uint256 updatedCount = $.coSignCount[payload.tenantId][payload.fileHash] + 1;
        $.coSignCount[payload.tenantId][payload.fileHash] = updatedCount;
        $.nonces[payload.tenantId][signer] = payload.nonce + 1;

        if (policy.enabled) {
            $.trustedCoSignCount[payload.tenantId][payload.fileHash] += 1;
            $.trustedCoSignRoleMask[payload.tenantId][payload.fileHash] |= roleMask;
            _evaluateCoSignQualification($, payload.tenantId, payload.fileHash, doc.docType);
        }

        emit IVoucherProtocolErrorsEvents.NonceConsumed(
            payload.tenantId, signer, payload.nonce, payload.nonce + 1
        );
        emit IVoucherProtocolErrorsEvents.DocumentCoSigned(
            payload.tenantId, payload.fileHash, signer, updatedCount
        );
    }

    function setCoSignPolicy(
        VoucherTypes.VoucherStorage storage $,
        bytes32 tenantId,
        uint32 docType,
        bool enabled,
        uint256 minStake,
        uint256 minSigners,
        uint256 requiredRoleMask
    ) external {
        if ($.tenants[tenantId].admin == address(0)) revert IVoucherProtocolErrorsEvents.TenantNotFound();
        if (!_hasRole(_opManagerRole(tenantId), msg.sender)) revert IVoucherProtocolErrorsEvents.Unauthorized();
        if (enabled && minSigners == 0 && requiredRoleMask == 0)
            revert IVoucherProtocolErrorsEvents.InvalidCoSignPolicy();

        $.tenantCoSignPolicies[tenantId][docType] = VoucherTypes.CoSignPolicy({
            enabled: enabled,
            minStake: minStake,
            minSigners: minSigners,
            requiredRoleMask: requiredRoleMask
        });
        emit IVoucherProtocolErrorsEvents.CoSignPolicyUpdated(
            tenantId, docType, enabled, minStake, minSigners, requiredRoleMask
        );
    }

    function setCoSignOperator(
        VoucherTypes.VoucherStorage storage $,
        bytes32 tenantId,
        uint32 docType,
        address operator,
        bool whitelisted,
        uint16 roleId
    ) external {
        if ($.tenants[tenantId].admin == address(0)) revert IVoucherProtocolErrorsEvents.TenantNotFound();
        if (!_hasRole(_opManagerRole(tenantId), msg.sender)) revert IVoucherProtocolErrorsEvents.Unauthorized();
        if (operator == address(0)) revert IVoucherProtocolErrorsEvents.InvalidOperatorAddress();
        if (whitelisted) _ensureNotProtocolAdmin(operator);

        if (whitelisted) {
            if (roleId < MIN_COSIGN_ROLE_ID || roleId > MAX_COSIGN_ROLE_ID)
                revert IVoucherProtocolErrorsEvents.InvalidCoSignRole();
            $.tenantCoSignRoles[tenantId][docType][operator] = roleId;
        } else {
            $.tenantCoSignRoles[tenantId][docType][operator] = COSIGN_ROLE_NONE;
        }

        $.tenantCoSignWhitelisted[tenantId][docType][operator] = whitelisted;
        emit IVoucherProtocolErrorsEvents.CoSignOperatorConfigured(
            tenantId, docType, operator, whitelisted,
            $.tenantCoSignRoles[tenantId][docType][operator]
        );
    }
}
