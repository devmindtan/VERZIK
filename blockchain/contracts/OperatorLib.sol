// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/IAccessControl.sol";
import "./VoucherTypes.sol";
import "./IVoucherProtocolErrorsEvents.sol";

/**
 * @title OperatorLib
 * @notice External library handling all operator lifecycle and configuration logic.
 *         Called via delegatecall from VoucherProtocol, reducing its bytecode size.
 */
library OperatorLib {
    bytes32 private constant PROTOCOL_ADMIN_ROLE = keccak256("PROTOCOL_ADMIN_ROLE");
    uint16 private constant MAX_PENALTY_BPS = 10_000;

    // --- PRIVATE HELPERS ---

    function _adminRole(bytes32 tenantId) private pure returns (bytes32) {
        return keccak256(abi.encode("TENANT_ADMIN_ROLE", tenantId));
    }

    function _opManagerRole(bytes32 tenantId) private pure returns (bytes32) {
        return keccak256(abi.encode("TENANT_OPERATOR_MANAGER_ROLE", tenantId));
    }

    /// @dev Works correctly in delegatecall context: address(this) = calling contract.
    function _hasRole(bytes32 role, address account) private view returns (bool) {
        return IAccessControl(address(this)).hasRole(role, account);
    }

    function _ensureNotProtocolAdmin(address account) private view {
        if (_hasRole(PROTOCOL_ADMIN_ROLE, account))
            revert IVoucherProtocolErrorsEvents.ProtocolAdminCannotHaveOtherRoles();
    }

    // --- EXTERNAL FUNCTIONS ---

    function joinAsOperator(
        VoucherTypes.VoucherStorage storage $,
        bytes32 tenantId,
        string calldata metadataURI
    ) external {
        _ensureNotProtocolAdmin(msg.sender);
        if ($.tenants[tenantId].admin == address(0)) revert IVoucherProtocolErrorsEvents.TenantNotFound();
        if (!$.tenants[tenantId].isActive) revert IVoucherProtocolErrorsEvents.TenantInactive();
        if (msg.value < $.tenantMinOperatorStake[tenantId])
            revert IVoucherProtocolErrorsEvents.InsufficientStake(msg.value, $.tenantMinOperatorStake[tenantId]);
        if ($.operators[tenantId][msg.sender].stakeAmount != 0 || $.operators[tenantId][msg.sender].isActive)
            revert IVoucherProtocolErrorsEvents.OperatorAlreadyActive();

        $.operators[tenantId][msg.sender] = VoucherTypes.Operator({
            tenantId: tenantId,
            walletAddress: msg.sender,
            metadataURI: metadataURI,
            stakeAmount: msg.value,
            isActive: true
        });
        if (!$.isOperatorListed[tenantId][msg.sender]) {
            $.operatorList[tenantId].push(msg.sender);
            $.isOperatorListed[tenantId][msg.sender] = true;
        }
        $.pendingUnstakeAt[tenantId][msg.sender] = 0;

        emit IVoucherProtocolErrorsEvents.OperatorJoined(tenantId, msg.sender, metadataURI, msg.value);
        emit IVoucherProtocolErrorsEvents.OperatorStatusUpdated(tenantId, msg.sender, true, "JOINED");
    }

    function topUpStake(VoucherTypes.VoucherStorage storage $, bytes32 tenantId) external {
        if ($.tenants[tenantId].admin == address(0)) revert IVoucherProtocolErrorsEvents.TenantNotFound();
        if (!$.tenants[tenantId].isActive) revert IVoucherProtocolErrorsEvents.TenantInactive();
        if ($.operators[tenantId][msg.sender].stakeAmount == 0) revert IVoucherProtocolErrorsEvents.OperatorNotInTenant();
        if (!$.operators[tenantId][msg.sender].isActive) revert IVoucherProtocolErrorsEvents.OperatorNotActive();
        if (msg.value == 0) revert IVoucherProtocolErrorsEvents.NoStake();

        $.operators[tenantId][msg.sender].stakeAmount += msg.value;
        emit IVoucherProtocolErrorsEvents.OperatorStakeToppedUp(
            tenantId, msg.sender, msg.value, $.operators[tenantId][msg.sender].stakeAmount
        );
    }

    function updateOperatorMetadata(
        VoucherTypes.VoucherStorage storage $,
        bytes32 tenantId,
        string calldata metadataURI
    ) external {
        if ($.tenants[tenantId].admin == address(0)) revert IVoucherProtocolErrorsEvents.TenantNotFound();
        if (!$.tenants[tenantId].isActive) revert IVoucherProtocolErrorsEvents.TenantInactive();
        if (!$.operators[tenantId][msg.sender].isActive) revert IVoucherProtocolErrorsEvents.OperatorNotActive();

        $.operators[tenantId][msg.sender].metadataURI = metadataURI;
        emit IVoucherProtocolErrorsEvents.OperatorMetadataUpdated(tenantId, msg.sender, metadataURI);
    }

    function requestUnstake(VoucherTypes.VoucherStorage storage $, bytes32 tenantId) external {
        if ($.tenants[tenantId].admin == address(0)) revert IVoucherProtocolErrorsEvents.TenantNotFound();
        if (!$.tenants[tenantId].isActive) revert IVoucherProtocolErrorsEvents.TenantInactive();
        if (!$.operators[tenantId][msg.sender].isActive) revert IVoucherProtocolErrorsEvents.OperatorNotActive();
        if ($.operators[tenantId][msg.sender].stakeAmount == 0) revert IVoucherProtocolErrorsEvents.NoStake();

        uint256 availableAt = block.timestamp + $.tenantUnstakeCooldown[tenantId];
        $.pendingUnstakeAt[tenantId][msg.sender] = availableAt;
        emit IVoucherProtocolErrorsEvents.OperatorUnstakeRequested(tenantId, msg.sender, availableAt);
    }

    function executeUnstake(VoucherTypes.VoucherStorage storage $, bytes32 tenantId) external {
        if ($.tenants[tenantId].admin == address(0)) revert IVoucherProtocolErrorsEvents.TenantNotFound();
        if (!$.tenants[tenantId].isActive) revert IVoucherProtocolErrorsEvents.TenantInactive();
        uint256 readyAt = $.pendingUnstakeAt[tenantId][msg.sender];
        if (readyAt == 0) revert IVoucherProtocolErrorsEvents.NoPendingUnstake();
        if (block.timestamp < readyAt) revert IVoucherProtocolErrorsEvents.UnstakeNotReady(readyAt);

        uint256 amount = $.operators[tenantId][msg.sender].stakeAmount;
        if (amount == 0) revert IVoucherProtocolErrorsEvents.NoStake();

        $.operators[tenantId][msg.sender].stakeAmount = 0;
        $.operators[tenantId][msg.sender].isActive = false;
        $.pendingUnstakeAt[tenantId][msg.sender] = 0;

        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        if (!sent) revert IVoucherProtocolErrorsEvents.EthTransferFailed();

        emit IVoucherProtocolErrorsEvents.OperatorUnstaked(tenantId, msg.sender, amount);
        emit IVoucherProtocolErrorsEvents.OperatorStatusUpdated(tenantId, msg.sender, false, "UNSTAKED");
    }

    function setOperatorStatus(
        VoucherTypes.VoucherStorage storage $,
        bytes32 tenantId,
        address operator,
        bool isActive,
        string calldata reason
    ) external {
        if ($.tenants[tenantId].admin == address(0)) revert IVoucherProtocolErrorsEvents.TenantNotFound();
        if (!_hasRole(_opManagerRole(tenantId), msg.sender)) revert IVoucherProtocolErrorsEvents.Unauthorized();
        if ($.operators[tenantId][operator].stakeAmount == 0) revert IVoucherProtocolErrorsEvents.NoStake();

        $.operators[tenantId][operator].isActive = isActive;
        if (!isActive) $.pendingUnstakeAt[tenantId][operator] = 0;

        emit IVoucherProtocolErrorsEvents.OperatorStatusUpdated(tenantId, operator, isActive, reason);
    }

    function setTreasury(
        VoucherTypes.VoucherStorage storage $,
        bytes32 tenantId,
        address newTreasury
    ) external {
        if ($.tenants[tenantId].admin == address(0)) revert IVoucherProtocolErrorsEvents.TenantNotFound();
        if (!_hasRole(_adminRole(tenantId), msg.sender)) revert IVoucherProtocolErrorsEvents.Unauthorized();
        if (newTreasury == address(0)) revert IVoucherProtocolErrorsEvents.InvalidTenantAddress();
        _ensureNotProtocolAdmin(newTreasury);
        if (
            _hasRole(_adminRole(tenantId), newTreasury) ||
            _hasRole(_opManagerRole(tenantId), newTreasury)
        ) revert IVoucherProtocolErrorsEvents.TenantRoleConflict();

        address oldTreasury = $.tenants[tenantId].treasury;
        $.tenants[tenantId].treasury = newTreasury;
        emit IVoucherProtocolErrorsEvents.TreasuryUpdated(tenantId, oldTreasury, newTreasury);
    }

    function slashOperator(
        VoucherTypes.VoucherStorage storage $,
        bytes32 tenantId,
        address operator,
        string calldata reason
    ) external {
        if ($.tenants[tenantId].admin == address(0)) revert IVoucherProtocolErrorsEvents.TenantNotFound();
        if (!_hasRole(_opManagerRole(tenantId), msg.sender)) revert IVoucherProtocolErrorsEvents.Unauthorized();

        uint256 amount = $.operators[tenantId][operator].stakeAmount;
        if (amount == 0) revert IVoucherProtocolErrorsEvents.NoStake();

        $.operators[tenantId][operator].isActive = false;
        $.operators[tenantId][operator].stakeAmount = 0;
        $.pendingUnstakeAt[tenantId][operator] = 0;
        delete $.recoveryDelegates[tenantId][operator];

        (bool sent, ) = payable($.tenants[tenantId].treasury).call{value: amount}("");
        if (!sent) revert IVoucherProtocolErrorsEvents.EthTransferFailed();

        emit IVoucherProtocolErrorsEvents.OperatorSlashed(tenantId, operator, amount, msg.sender, reason);
        emit IVoucherProtocolErrorsEvents.OperatorStatusUpdated(tenantId, operator, false, "SLASHED");
    }

    function softSlashOperator(
        VoucherTypes.VoucherStorage storage $,
        bytes32 tenantId,
        address operator,
        bytes32 violationCode,
        string calldata reason
    ) external {
        if (msg.sender == operator) revert IVoucherProtocolErrorsEvents.CannotSlashYourself();
        if ($.tenants[tenantId].admin == address(0)) revert IVoucherProtocolErrorsEvents.TenantNotFound();
        if (!_hasRole(_opManagerRole(tenantId), msg.sender)) revert IVoucherProtocolErrorsEvents.Unauthorized();

        uint256 stakeBefore = $.operators[tenantId][operator].stakeAmount;
        if (stakeBefore == 0) revert IVoucherProtocolErrorsEvents.NoStake();

        uint16 penaltyBps = $.tenantViolationPenalties[tenantId][violationCode];
        if (penaltyBps == 0) revert IVoucherProtocolErrorsEvents.PenaltyNotConfigured(violationCode);

        uint256 slashAmount = (stakeBefore * penaltyBps) / MAX_PENALTY_BPS;
        if (slashAmount == 0) slashAmount = 1;

        uint256 remaining = stakeBefore - slashAmount;
        $.operators[tenantId][operator].stakeAmount = remaining;
        $.pendingUnstakeAt[tenantId][operator] = 0;

        if (remaining < $.tenantMinOperatorStake[tenantId]) {
            $.operators[tenantId][operator].isActive = false;
            delete $.recoveryDelegates[tenantId][operator];
            emit IVoucherProtocolErrorsEvents.OperatorStatusUpdated(
                tenantId, operator, false, "SOFT_SLASHED_BELOW_MIN_STAKE"
            );
        }

        (bool sent, ) = payable($.tenants[tenantId].treasury).call{value: slashAmount}("");
        if (!sent) revert IVoucherProtocolErrorsEvents.EthTransferFailed();

        emit IVoucherProtocolErrorsEvents.OperatorSoftSlashed(
            tenantId, operator, violationCode, penaltyBps, slashAmount, remaining, msg.sender, reason
        );
    }

    function setMinOperatorStake(
        VoucherTypes.VoucherStorage storage $,
        bytes32 tenantId,
        uint256 newMinOperatorStake
    ) external {
        if ($.tenants[tenantId].admin == address(0)) revert IVoucherProtocolErrorsEvents.TenantNotFound();
        if (!_hasRole(_opManagerRole(tenantId), msg.sender)) revert IVoucherProtocolErrorsEvents.Unauthorized();
        if (newMinOperatorStake == 0) revert IVoucherProtocolErrorsEvents.InvalidConfigValue();

        uint256 oldValue = $.tenantMinOperatorStake[tenantId];
        $.tenantMinOperatorStake[tenantId] = newMinOperatorStake;
        emit IVoucherProtocolErrorsEvents.MinOperatorStakeUpdated(tenantId, oldValue, newMinOperatorStake);
    }

    function setUnstakeCooldown(
        VoucherTypes.VoucherStorage storage $,
        bytes32 tenantId,
        uint256 newUnstakeCooldown
    ) external {
        if ($.tenants[tenantId].admin == address(0)) revert IVoucherProtocolErrorsEvents.TenantNotFound();
        if (!_hasRole(_opManagerRole(tenantId), msg.sender)) revert IVoucherProtocolErrorsEvents.Unauthorized();
        if (newUnstakeCooldown == 0) revert IVoucherProtocolErrorsEvents.InvalidConfigValue();

        uint256 oldValue = $.tenantUnstakeCooldown[tenantId];
        $.tenantUnstakeCooldown[tenantId] = newUnstakeCooldown;
        emit IVoucherProtocolErrorsEvents.UnstakeCooldownUpdated(tenantId, oldValue, newUnstakeCooldown);
    }

    function setViolationPenalty(
        VoucherTypes.VoucherStorage storage $,
        bytes32 tenantId,
        bytes32 violationCode,
        uint16 penaltyBps
    ) external {
        if ($.tenants[tenantId].admin == address(0)) revert IVoucherProtocolErrorsEvents.TenantNotFound();
        if (!_hasRole(_opManagerRole(tenantId), msg.sender)) revert IVoucherProtocolErrorsEvents.Unauthorized();
        if (violationCode == bytes32(0)) revert IVoucherProtocolErrorsEvents.InvalidConfigValue();
        if (penaltyBps == 0 || penaltyBps > MAX_PENALTY_BPS)
            revert IVoucherProtocolErrorsEvents.InvalidPenaltyBps(penaltyBps);

        uint16 oldPenalty = $.tenantViolationPenalties[tenantId][violationCode];
        $.tenantViolationPenalties[tenantId][violationCode] = penaltyBps;
        emit IVoucherProtocolErrorsEvents.ViolationPenaltyUpdated(tenantId, violationCode, oldPenalty, penaltyBps);
    }
}
