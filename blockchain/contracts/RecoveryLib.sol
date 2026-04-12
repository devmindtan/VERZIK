// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/IAccessControl.sol";
import "./VoucherTypes.sol";
import "./IVoucherProtocolErrorsEvents.sol";

/**
 * @title RecoveryLib
 * @notice External library handling operator recovery and recovery delegate logic.
 *         Called via delegatecall from VoucherProtocol, reducing its bytecode size.
 */
library RecoveryLib {
    bytes32 private constant PROTOCOL_ADMIN_ROLE = keccak256("PROTOCOL_ADMIN_ROLE");

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

    function _linkRecoveryAlias(
        VoucherTypes.VoucherStorage storage $,
        bytes32 tenantId,
        address oldOperator,
        address newOperator
    ) private returns (address rootOperator) {
        rootOperator = $.recoveredFrom[tenantId][oldOperator];
        if (rootOperator == address(0)) rootOperator = oldOperator;
        $.recoveredFrom[tenantId][newOperator] = rootOperator;
        $.recoveredTo[tenantId][oldOperator] = newOperator;
    }

    // --- EXTERNAL FUNCTIONS ---

    function setRecoveryDelegate(
        VoucherTypes.VoucherStorage storage $,
        bytes32 tenantId,
        address delegate
    ) external {
        if ($.tenants[tenantId].admin == address(0)) revert IVoucherProtocolErrorsEvents.TenantNotFound();
        if (!$.operators[tenantId][msg.sender].isActive) revert IVoucherProtocolErrorsEvents.OperatorNotActive();
        if (delegate == address(0) || delegate == msg.sender)
            revert IVoucherProtocolErrorsEvents.InvalidRecoveryTarget();
        _ensureNotProtocolAdmin(delegate);

        $.recoveryDelegates[tenantId][msg.sender] = delegate;
        emit IVoucherProtocolErrorsEvents.OperatorRecoveryDelegateUpdated(tenantId, msg.sender, delegate);
    }

    function recoverOperatorByDelegate(
        VoucherTypes.VoucherStorage storage $,
        bytes32 tenantId,
        address lostOperator,
        string calldata reason
    ) external {
        if ($.tenants[tenantId].admin == address(0)) revert IVoucherProtocolErrorsEvents.TenantNotFound();
        _ensureNotProtocolAdmin(msg.sender);
        if ($.operators[tenantId][lostOperator].isActive) revert IVoucherProtocolErrorsEvents.OperatorNotLost();
        if ($.operators[tenantId][lostOperator].stakeAmount == 0) revert IVoucherProtocolErrorsEvents.NoStakeToRecover();
        if ($.pendingUnstakeAt[tenantId][lostOperator] > 0) revert IVoucherProtocolErrorsEvents.UnstakeInProgress();
        if ($.recoveryDelegates[tenantId][lostOperator] != msg.sender) revert IVoucherProtocolErrorsEvents.RecoveryNotAllowed();
        if ($.operators[tenantId][msg.sender].stakeAmount != 0 || $.operators[tenantId][msg.sender].isActive)
            revert IVoucherProtocolErrorsEvents.InvalidRecoveryTarget();

        VoucherTypes.Operator memory oldData = $.operators[tenantId][lostOperator];
        if (oldData.stakeAmount == 0) revert IVoucherProtocolErrorsEvents.NoStake();

        $.operators[tenantId][msg.sender] = VoucherTypes.Operator({
            tenantId: tenantId,
            walletAddress: msg.sender,
            metadataURI: oldData.metadataURI,
            stakeAmount: oldData.stakeAmount,
            isActive: oldData.isActive
        });
        if (!$.isOperatorListed[tenantId][msg.sender]) {
            $.operatorList[tenantId].push(msg.sender);
            $.isOperatorListed[tenantId][msg.sender] = true;
        }
        $.nonces[tenantId][msg.sender] = $.nonces[tenantId][lostOperator];
        $.pendingUnstakeAt[tenantId][msg.sender] = 0;
        address rootOperator = _linkRecoveryAlias($, tenantId, lostOperator, msg.sender);

        delete $.operators[tenantId][lostOperator];
        delete $.nonces[tenantId][lostOperator];
        delete $.pendingUnstakeAt[tenantId][lostOperator];
        delete $.recoveryDelegates[tenantId][lostOperator];

        emit IVoucherProtocolErrorsEvents.OperatorRecovered(
            tenantId, lostOperator, msg.sender, oldData.stakeAmount, reason
        );
        emit IVoucherProtocolErrorsEvents.OperatorRecoveryAliasUpdated(tenantId, lostOperator, msg.sender, rootOperator);
        emit IVoucherProtocolErrorsEvents.OperatorRecoveryDelegateUpdated(tenantId, msg.sender, address(0));
    }

    function recoverOperatorByAdmin(
        VoucherTypes.VoucherStorage storage $,
        bytes32 tenantId,
        address lostOperator,
        address newOperator,
        string calldata reason
    ) external {
        if ($.tenants[tenantId].admin == address(0)) revert IVoucherProtocolErrorsEvents.TenantNotFound();
        if (!_hasRole(_opManagerRole(tenantId), msg.sender)) revert IVoucherProtocolErrorsEvents.Unauthorized();
        if ($.operators[tenantId][lostOperator].isActive) revert IVoucherProtocolErrorsEvents.OperatorNotLost();
        if (newOperator == address(0) || newOperator == lostOperator)
            revert IVoucherProtocolErrorsEvents.InvalidRecoveryTarget();
        _ensureNotProtocolAdmin(newOperator);
        if ($.operators[tenantId][newOperator].stakeAmount != 0 || $.operators[tenantId][newOperator].isActive)
            revert IVoucherProtocolErrorsEvents.InvalidRecoveryTarget();

        VoucherTypes.Operator memory oldData = $.operators[tenantId][lostOperator];
        if (oldData.stakeAmount == 0) revert IVoucherProtocolErrorsEvents.NoStake();

        $.operators[tenantId][newOperator] = VoucherTypes.Operator({
            tenantId: tenantId,
            walletAddress: newOperator,
            metadataURI: oldData.metadataURI,
            stakeAmount: oldData.stakeAmount,
            isActive: oldData.isActive
        });
        if (!$.isOperatorListed[tenantId][newOperator]) {
            $.operatorList[tenantId].push(newOperator);
            $.isOperatorListed[tenantId][newOperator] = true;
        }
        $.nonces[tenantId][newOperator] = $.nonces[tenantId][lostOperator];
        $.pendingUnstakeAt[tenantId][newOperator] = 0;
        address rootOperator = _linkRecoveryAlias($, tenantId, lostOperator, newOperator);

        delete $.operators[tenantId][lostOperator];
        delete $.nonces[tenantId][lostOperator];
        delete $.pendingUnstakeAt[tenantId][lostOperator];
        delete $.recoveryDelegates[tenantId][lostOperator];

        emit IVoucherProtocolErrorsEvents.OperatorRecovered(
            tenantId, lostOperator, newOperator, oldData.stakeAmount, reason
        );
        emit IVoucherProtocolErrorsEvents.OperatorRecoveryAliasUpdated(tenantId, lostOperator, newOperator, rootOperator);
        emit IVoucherProtocolErrorsEvents.OperatorRecoveryDelegateUpdated(tenantId, newOperator, address(0));
    }
}
