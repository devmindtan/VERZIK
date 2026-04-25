import type { WalletSession } from "../components/access";

export interface TenantInfo {
  id: string;
  admin: string;
  operatorManager: string;
  treasury: string;
  isActive: boolean;
  createdAt: string;
}

export interface OperatorStatus {
  walletAddress: string;
  isActive: boolean;
  stakeAmount: string;
  nonce: number;
  recoveryDelegate: string;
  canUnstakeNow: boolean;
}
export interface AppGraphConfig {
  endpoint: string;
  apiKey?: string;
}

export interface TenantCreatedRow {
  tenantId: string;
  admin: string;
  treasury: string;
  blockTimestamp: string;
}

export interface TenantStatusUpdatedRow {
  tenantId: string;
  isActive: boolean;
  blockTimestamp: string;
}

export interface OperatorJoinedRow {
  tenantId: string;
  operator: string;
  metadata: string;
  stake: string;
  blockTimestamp: string;
}

export interface OperatorStatusUpdatedRow {
  tenantId: string;
  operator: string;
  isActive: boolean;
  blockTimestamp: string;
}

export interface OperatorRecoveryDelegateUpdatedRow {
  tenantId: string;
  operator: string;
  delegate: string;
  blockTimestamp: string;
}

export interface OperatorUnstakeRequestedRow {
  tenantId: string;
  operator: string;
  availableAt: string;
  blockTimestamp: string;
}

export interface OperatorStakeToppedUpRow {
  tenantId: string;
  operator: string;
  totalStake: string;
  blockTimestamp: string;
}

export interface DocumentAnchoredRow {
  issuer: string;
  cid: string;
  blockTimestamp: string;
}

export interface DocumentRevokedRow {
  blockTimestamp: string;
}

export interface CoSignPolicyUpdatedRow {
  tenantId: string;
  docType: string;
  enabled: boolean;
  minStake: string;
  minSigners: string;
  requiredRoleMask: string;
  blockTimestamp: string;
}

export interface ViolationPenaltyUpdatedRow {
  tenantId: string;
  violationCode: string;
  newPenaltyBps: number;
  blockTimestamp: string;
}

export interface AccountSnapshot {
  session: WalletSession;
  balanceEth: string;
  networkName: string;
}

export interface CoSignPolicyView {
  docType: number;
  enabled: boolean;
  minStake: string;
  minSigners: number;
  requiredRoleMask: string;
}

export interface ViolationPenaltyView {
  violationCode: string;
  penaltyBps: number;
}
