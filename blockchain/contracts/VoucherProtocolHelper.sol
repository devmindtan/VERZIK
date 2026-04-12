// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./IVoucherProtocolErrorsEvents.sol";

abstract contract VoucherProtocolHelper {
    uint8 internal constant TENANT_ROLE_NONE = 0;
    uint8 internal constant TENANT_ROLE_ADMIN = 1;
    uint8 internal constant TENANT_ROLE_OPERATOR_MANAGER = 2;

    mapping(bytes32 => bytes32) internal tenantRoleToTenantId;
    mapping(bytes32 => uint8) internal tenantRoleKinds;

    function _protocolAdminRole() internal pure virtual returns (bytes32);
    function _hasRoleInternal(bytes32 role, address account) internal view virtual returns (bool);
    function _getTenantTreasury(bytes32 tenantId) internal view virtual returns (address);

    function _roleToMask(uint16 roleId) internal pure returns (uint256) {
        return uint256(1) << (roleId - 1);
    }

    function _getTenantAdminRole(bytes32 tenantId) internal pure returns (bytes32) {
        return keccak256(abi.encode("TENANT_ADMIN_ROLE", tenantId));
    }

    function _getTenantOperatorManagerRole(bytes32 tenantId) internal pure returns (bytes32) {
        return keccak256(abi.encode("TENANT_OPERATOR_MANAGER_ROLE", tenantId));
    }

    function _ensureNoTenantRoleCollisionOnCreate(
        address admin,
        address operatorManager,
        address treasury
    ) internal pure {
        if (admin == operatorManager || treasury == admin || treasury == operatorManager) {
            revert IVoucherProtocolErrorsEvents.TenantRoleConflict();
        }
    }

    function _ensureNotProtocolAdmin(address account) internal view {
        if (_hasRoleInternal(_protocolAdminRole(), account)) {
            revert IVoucherProtocolErrorsEvents.ProtocolAdminCannotHaveOtherRoles();
        }
    }

    function _registerTenantRole(bytes32 role, bytes32 tenantId, uint8 roleKind) internal {
        tenantRoleToTenantId[role] = tenantId;
        tenantRoleKinds[role] = roleKind;
    }

    function _enforceTenantRoleSegregationOnGrant(bytes32 role, address account) internal view {
        uint8 roleKind = tenantRoleKinds[role];
        if (roleKind == TENANT_ROLE_NONE) {
            return;
        }

        bytes32 tenantId = tenantRoleToTenantId[role];
        _ensureNotProtocolAdmin(account);

        if (roleKind == TENANT_ROLE_ADMIN) {
            if (
                _hasRoleInternal(_getTenantOperatorManagerRole(tenantId), account)
                    || _getTenantTreasury(tenantId) == account
            ) {
                revert IVoucherProtocolErrorsEvents.TenantRoleConflict();
            }
            return;
        }

        if (_hasRoleInternal(_getTenantAdminRole(tenantId), account) || _getTenantTreasury(tenantId) == account) {
            revert IVoucherProtocolErrorsEvents.TenantRoleConflict();
        }
    }

    function _hasAnyTenantGovernanceRole(bytes32 tenantId, address account) internal view returns (bool) {
        return _hasRoleInternal(_getTenantAdminRole(tenantId), account)
            || _hasRoleInternal(_getTenantOperatorManagerRole(tenantId), account);
    }
}