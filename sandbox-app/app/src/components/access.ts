export type Page =
  | "dashboard"
  | "tenants"
  | "operators"
  | "documents"
  | "cosign"
  | "slash"
  | "treasury"
  | "tx";

export type PrimaryRole = "owner" | "tenant" | "operator" | "guest";
export type TenantRole = "admin" | "manager" | "treasury" | null;

export interface WalletSession {
  id: string;
  label: string;
  address: string;
  primaryRole: PrimaryRole;
  tenantRole: TenantRole;
  tenantId?: string;
}

export interface RoleCapabilities {
  canCreateTenant: boolean;
  canSetTenantStatus: boolean;
  canEditTenantConfig: boolean;
  canJoinOperator: boolean;
  canManageOperators: boolean;
  canManageStake: boolean;
  canRegisterDocument: boolean;
  canVerifyDocument: boolean;
  canCoSignDocument: boolean;
  canRevokeDocument: boolean;
  canEditCoSignPolicy: boolean;
  canSlashOperator: boolean;
  canEditViolationPenalty: boolean;
}

export const ROLE_ADDRESS_BOOK: WalletSession[] = [
  {
    id: "owner-root",
    label: "Owner / Root",
    address: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
    primaryRole: "owner",
    tenantRole: null,
  },
  {
    id: "tenant-admin-1",
    label: "Tenant Admin #1",
    address: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
    primaryRole: "tenant",
    tenantRole: "admin",
    tenantId: "1",
  },
  {
    id: "tenant-manager-1",
    label: "Tenant Manager #1",
    address: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
    primaryRole: "tenant",
    tenantRole: "manager",
    tenantId: "1",
  },
  {
    id: "tenant-treasury-1",
    label: "Tenant Treasury #1",
    address: "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
    primaryRole: "tenant",
    tenantRole: "treasury",
    tenantId: "1",
  },
  {
    id: "operator-8",
    label: "Operator #8",
    address: "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65",
    primaryRole: "operator",
    tenantRole: null,
    tenantId: "1",
  },
];

export function resolveSessionByAddress(address: string): WalletSession {
  const normalized = address.toLowerCase();
  const matched = ROLE_ADDRESS_BOOK.find(
    (wallet) => wallet.address.toLowerCase() === normalized,
  );

  if (matched) {
    return {
      ...matched,
      address: normalized,
      id: `${matched.id}-${normalized}`,
    };
  }

  return {
    id: `guest-${normalized}`,
    label: "Ví không có quyền",
    address: normalized,
    primaryRole: "guest",
    tenantRole: null,
  };
}

export function getRoleLabel(session: WalletSession) {
  if (session.primaryRole === "owner") return "Owner";
  if (session.primaryRole === "operator") return "Operator";
  if (session.primaryRole === "guest") return "Read Only";
  return `Tenant ${session.tenantRole ?? "member"}`;
}

export function getVisiblePages(session: WalletSession): Page[] {
  if (session.primaryRole === "guest") {
    return [
      "dashboard",
      "tenants",
      "operators",
      "documents",
      "cosign",
      "slash",
      "treasury",
      "tx",
    ];
  }
  return [
    "dashboard",
    "tenants",
    "operators",
    "documents",
    "cosign",
    "slash",
    "treasury",
    "tx",
  ];
}

export function getCapabilities(session: WalletSession): RoleCapabilities {
  if (session.primaryRole === "owner") {
    return {
      canCreateTenant: true,
      canSetTenantStatus: true,
      canEditTenantConfig: false,
      canJoinOperator: false,
      canManageOperators: false,
      canManageStake: false,
      canRegisterDocument: false,
      canVerifyDocument: true,
      canCoSignDocument: false,
      canRevokeDocument: false,
      canEditCoSignPolicy: false,
      canSlashOperator: false,
      canEditViolationPenalty: false,
    };
  }

  if (session.primaryRole === "operator") {
    return {
      canCreateTenant: false,
      canSetTenantStatus: false,
      canEditTenantConfig: false,
      canJoinOperator: false,
      canManageOperators: false,
      canManageStake: true,
      canRegisterDocument: true,
      canVerifyDocument: true,
      canCoSignDocument: true,
      canRevokeDocument: true,
      canEditCoSignPolicy: false,
      canSlashOperator: false,
      canEditViolationPenalty: false,
    };
  }

  if (session.primaryRole === "tenant") {
    if (session.tenantRole === "admin") {
      return {
        canCreateTenant: false,
        canSetTenantStatus: false,
        canEditTenantConfig: false,
        canJoinOperator: false,
        canManageOperators: false,
        canManageStake: false,
        canRegisterDocument: false,
        canVerifyDocument: true,
        canCoSignDocument: false,
        canRevokeDocument: true,
        canEditCoSignPolicy: false,
        canSlashOperator: false,
        canEditViolationPenalty: false,
      };
    }

    if (session.tenantRole === "manager") {
      return {
        canCreateTenant: false,
        canSetTenantStatus: false,
        canEditTenantConfig: true,
        canJoinOperator: false,
        canManageOperators: true,
        canManageStake: false,
        canRegisterDocument: false,
        canVerifyDocument: true,
        canCoSignDocument: false,
        canRevokeDocument: false,
        canEditCoSignPolicy: true,
        canSlashOperator: true,
        canEditViolationPenalty: true,
      };
    }

    if (session.tenantRole === "treasury") {
      return {
        canCreateTenant: false,
        canSetTenantStatus: false,
        canEditTenantConfig: false,
        canJoinOperator: false,
        canManageOperators: false,
        canManageStake: false,
        canRegisterDocument: false,
        canVerifyDocument: true,
        canCoSignDocument: false,
        canRevokeDocument: false,
        canEditCoSignPolicy: false,
        canSlashOperator: false,
        canEditViolationPenalty: false,
      };
    }
  }

  return {
    canCreateTenant: false,
    canSetTenantStatus: false,
    canEditTenantConfig: false,
    canJoinOperator: false,
    canManageOperators: false,
    canManageStake: false,
    canRegisterDocument: false,
    canVerifyDocument: true,
    canCoSignDocument: false,
    canRevokeDocument: false,
    canEditCoSignPolicy: false,
    canSlashOperator: false,
    canEditViolationPenalty: false,
  };
}

export function getScopeDescription(session: WalletSession) {
  if (session.primaryRole === "owner") {
    return "Protocol owner/admin: chỉ quản trị tenant (tạo, bật/tắt tenant), các module cấp dưới chỉ xem và tra cứu.";
  }

  if (session.primaryRole === "operator") {
    return "Operator wallet: join/topup/unstake/recovery, ký & co-sign tài liệu theo policy, tra cứu giao dịch.";
  }

  if (session.primaryRole === "tenant") {
    if (session.tenantRole === "admin") {
      return `Tenant admin #${session.tenantId}: quản trị vai trò tenant-level và có quyền revoke document / set treasury.`;
    }
    if (session.tenantRole === "manager") {
      return `Tenant operator-manager #${session.tenantId}: quản lý operator, policy co-sign, slash và runtime config.`;
    }
    if (session.tenantRole === "treasury") {
      return `Tenant treasury #${session.tenantId}: theo dõi và quản lý tài chính tiền cọc (stake, pending unstake, slash payout) ở chế độ read-only.`;
    }
  }

  return "Ví này ở chế độ read-only: được xem, tra cứu, xác thực; không có quyền set/cập nhật.";
}
