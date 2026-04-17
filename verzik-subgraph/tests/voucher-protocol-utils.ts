import { newMockEvent } from "matchstick-as"
import { ethereum, Bytes, BigInt, Address } from "@graphprotocol/graph-ts"
import {
  CoSignOperatorConfigured,
  CoSignPolicyUpdated,
  DocumentAnchored,
  DocumentCoSignQualified,
  DocumentCoSigned,
  DocumentRevoked,
  MinOperatorStakeUpdated,
  NonceConsumed,
  OperatorJoined,
  OperatorMetadataUpdated,
  OperatorRecovered,
  OperatorRecoveryAliasUpdated,
  OperatorRecoveryDelegateUpdated,
  OperatorSlashed,
  OperatorSoftSlashed,
  OperatorStakeToppedUp,
  OperatorStatusUpdated,
  OperatorUnstakeRequested,
  OperatorUnstaked,
  ProtocolInitialized,
  RoleAdminChanged,
  RoleGranted,
  RoleRevoked,
  TenantCreated,
  TenantStatusUpdated,
  TreasuryUpdated,
  UnstakeCooldownUpdated,
  ViolationPenaltyUpdated
} from "../generated/VoucherProtocol/VoucherProtocol"

export function createCoSignOperatorConfiguredEvent(
  tenantId: Bytes,
  docType: BigInt,
  operator: Address,
  whitelisted: boolean,
  roleId: i32
): CoSignOperatorConfigured {
  let coSignOperatorConfiguredEvent =
    changetype<CoSignOperatorConfigured>(newMockEvent())

  coSignOperatorConfiguredEvent.parameters = new Array()

  coSignOperatorConfiguredEvent.parameters.push(
    new ethereum.EventParam("tenantId", ethereum.Value.fromFixedBytes(tenantId))
  )
  coSignOperatorConfiguredEvent.parameters.push(
    new ethereum.EventParam(
      "docType",
      ethereum.Value.fromUnsignedBigInt(docType)
    )
  )
  coSignOperatorConfiguredEvent.parameters.push(
    new ethereum.EventParam("operator", ethereum.Value.fromAddress(operator))
  )
  coSignOperatorConfiguredEvent.parameters.push(
    new ethereum.EventParam(
      "whitelisted",
      ethereum.Value.fromBoolean(whitelisted)
    )
  )
  coSignOperatorConfiguredEvent.parameters.push(
    new ethereum.EventParam(
      "roleId",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(roleId))
    )
  )

  return coSignOperatorConfiguredEvent
}

export function createCoSignPolicyUpdatedEvent(
  tenantId: Bytes,
  docType: BigInt,
  enabled: boolean,
  minStake: BigInt,
  minSigners: BigInt,
  requiredRoleMask: BigInt
): CoSignPolicyUpdated {
  let coSignPolicyUpdatedEvent = changetype<CoSignPolicyUpdated>(newMockEvent())

  coSignPolicyUpdatedEvent.parameters = new Array()

  coSignPolicyUpdatedEvent.parameters.push(
    new ethereum.EventParam("tenantId", ethereum.Value.fromFixedBytes(tenantId))
  )
  coSignPolicyUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "docType",
      ethereum.Value.fromUnsignedBigInt(docType)
    )
  )
  coSignPolicyUpdatedEvent.parameters.push(
    new ethereum.EventParam("enabled", ethereum.Value.fromBoolean(enabled))
  )
  coSignPolicyUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "minStake",
      ethereum.Value.fromUnsignedBigInt(minStake)
    )
  )
  coSignPolicyUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "minSigners",
      ethereum.Value.fromUnsignedBigInt(minSigners)
    )
  )
  coSignPolicyUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "requiredRoleMask",
      ethereum.Value.fromUnsignedBigInt(requiredRoleMask)
    )
  )

  return coSignPolicyUpdatedEvent
}

export function createDocumentAnchoredEvent(
  tenantId: Bytes,
  fileHash: Bytes,
  owner: Address,
  cid: string,
  issuer: Address,
  ciphertextHash: Bytes,
  encryptionMetaHash: Bytes,
  docType: BigInt,
  version: BigInt
): DocumentAnchored {
  let documentAnchoredEvent = changetype<DocumentAnchored>(newMockEvent())

  documentAnchoredEvent.parameters = new Array()

  documentAnchoredEvent.parameters.push(
    new ethereum.EventParam("tenantId", ethereum.Value.fromFixedBytes(tenantId))
  )
  documentAnchoredEvent.parameters.push(
    new ethereum.EventParam("fileHash", ethereum.Value.fromFixedBytes(fileHash))
  )
  documentAnchoredEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  documentAnchoredEvent.parameters.push(
    new ethereum.EventParam("cid", ethereum.Value.fromString(cid))
  )
  documentAnchoredEvent.parameters.push(
    new ethereum.EventParam("issuer", ethereum.Value.fromAddress(issuer))
  )
  documentAnchoredEvent.parameters.push(
    new ethereum.EventParam(
      "ciphertextHash",
      ethereum.Value.fromFixedBytes(ciphertextHash)
    )
  )
  documentAnchoredEvent.parameters.push(
    new ethereum.EventParam(
      "encryptionMetaHash",
      ethereum.Value.fromFixedBytes(encryptionMetaHash)
    )
  )
  documentAnchoredEvent.parameters.push(
    new ethereum.EventParam(
      "docType",
      ethereum.Value.fromUnsignedBigInt(docType)
    )
  )
  documentAnchoredEvent.parameters.push(
    new ethereum.EventParam(
      "version",
      ethereum.Value.fromUnsignedBigInt(version)
    )
  )

  return documentAnchoredEvent
}

export function createDocumentCoSignQualifiedEvent(
  tenantId: Bytes,
  fileHash: Bytes,
  trustedSigners: BigInt,
  roleMask: BigInt
): DocumentCoSignQualified {
  let documentCoSignQualifiedEvent =
    changetype<DocumentCoSignQualified>(newMockEvent())

  documentCoSignQualifiedEvent.parameters = new Array()

  documentCoSignQualifiedEvent.parameters.push(
    new ethereum.EventParam("tenantId", ethereum.Value.fromFixedBytes(tenantId))
  )
  documentCoSignQualifiedEvent.parameters.push(
    new ethereum.EventParam("fileHash", ethereum.Value.fromFixedBytes(fileHash))
  )
  documentCoSignQualifiedEvent.parameters.push(
    new ethereum.EventParam(
      "trustedSigners",
      ethereum.Value.fromUnsignedBigInt(trustedSigners)
    )
  )
  documentCoSignQualifiedEvent.parameters.push(
    new ethereum.EventParam(
      "roleMask",
      ethereum.Value.fromUnsignedBigInt(roleMask)
    )
  )

  return documentCoSignQualifiedEvent
}

export function createDocumentCoSignedEvent(
  tenantId: Bytes,
  fileHash: Bytes,
  signer: Address,
  totalSigners: BigInt
): DocumentCoSigned {
  let documentCoSignedEvent = changetype<DocumentCoSigned>(newMockEvent())

  documentCoSignedEvent.parameters = new Array()

  documentCoSignedEvent.parameters.push(
    new ethereum.EventParam("tenantId", ethereum.Value.fromFixedBytes(tenantId))
  )
  documentCoSignedEvent.parameters.push(
    new ethereum.EventParam("fileHash", ethereum.Value.fromFixedBytes(fileHash))
  )
  documentCoSignedEvent.parameters.push(
    new ethereum.EventParam("signer", ethereum.Value.fromAddress(signer))
  )
  documentCoSignedEvent.parameters.push(
    new ethereum.EventParam(
      "totalSigners",
      ethereum.Value.fromUnsignedBigInt(totalSigners)
    )
  )

  return documentCoSignedEvent
}

export function createDocumentRevokedEvent(
  tenantId: Bytes,
  fileHash: Bytes,
  revoker: Address,
  reason: string
): DocumentRevoked {
  let documentRevokedEvent = changetype<DocumentRevoked>(newMockEvent())

  documentRevokedEvent.parameters = new Array()

  documentRevokedEvent.parameters.push(
    new ethereum.EventParam("tenantId", ethereum.Value.fromFixedBytes(tenantId))
  )
  documentRevokedEvent.parameters.push(
    new ethereum.EventParam("fileHash", ethereum.Value.fromFixedBytes(fileHash))
  )
  documentRevokedEvent.parameters.push(
    new ethereum.EventParam("revoker", ethereum.Value.fromAddress(revoker))
  )
  documentRevokedEvent.parameters.push(
    new ethereum.EventParam("reason", ethereum.Value.fromString(reason))
  )

  return documentRevokedEvent
}

export function createMinOperatorStakeUpdatedEvent(
  tenantId: Bytes,
  oldValue: BigInt,
  newValue: BigInt
): MinOperatorStakeUpdated {
  let minOperatorStakeUpdatedEvent =
    changetype<MinOperatorStakeUpdated>(newMockEvent())

  minOperatorStakeUpdatedEvent.parameters = new Array()

  minOperatorStakeUpdatedEvent.parameters.push(
    new ethereum.EventParam("tenantId", ethereum.Value.fromFixedBytes(tenantId))
  )
  minOperatorStakeUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "oldValue",
      ethereum.Value.fromUnsignedBigInt(oldValue)
    )
  )
  minOperatorStakeUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newValue",
      ethereum.Value.fromUnsignedBigInt(newValue)
    )
  )

  return minOperatorStakeUpdatedEvent
}

export function createNonceConsumedEvent(
  tenantId: Bytes,
  signer: Address,
  oldNonce: BigInt,
  newNonce: BigInt
): NonceConsumed {
  let nonceConsumedEvent = changetype<NonceConsumed>(newMockEvent())

  nonceConsumedEvent.parameters = new Array()

  nonceConsumedEvent.parameters.push(
    new ethereum.EventParam("tenantId", ethereum.Value.fromFixedBytes(tenantId))
  )
  nonceConsumedEvent.parameters.push(
    new ethereum.EventParam("signer", ethereum.Value.fromAddress(signer))
  )
  nonceConsumedEvent.parameters.push(
    new ethereum.EventParam(
      "oldNonce",
      ethereum.Value.fromUnsignedBigInt(oldNonce)
    )
  )
  nonceConsumedEvent.parameters.push(
    new ethereum.EventParam(
      "newNonce",
      ethereum.Value.fromUnsignedBigInt(newNonce)
    )
  )

  return nonceConsumedEvent
}

export function createOperatorJoinedEvent(
  tenantId: Bytes,
  operator: Address,
  metadata: string,
  stake: BigInt
): OperatorJoined {
  let operatorJoinedEvent = changetype<OperatorJoined>(newMockEvent())

  operatorJoinedEvent.parameters = new Array()

  operatorJoinedEvent.parameters.push(
    new ethereum.EventParam("tenantId", ethereum.Value.fromFixedBytes(tenantId))
  )
  operatorJoinedEvent.parameters.push(
    new ethereum.EventParam("operator", ethereum.Value.fromAddress(operator))
  )
  operatorJoinedEvent.parameters.push(
    new ethereum.EventParam("metadata", ethereum.Value.fromString(metadata))
  )
  operatorJoinedEvent.parameters.push(
    new ethereum.EventParam("stake", ethereum.Value.fromUnsignedBigInt(stake))
  )

  return operatorJoinedEvent
}

export function createOperatorMetadataUpdatedEvent(
  tenantId: Bytes,
  operator: Address,
  metadataURI: string
): OperatorMetadataUpdated {
  let operatorMetadataUpdatedEvent =
    changetype<OperatorMetadataUpdated>(newMockEvent())

  operatorMetadataUpdatedEvent.parameters = new Array()

  operatorMetadataUpdatedEvent.parameters.push(
    new ethereum.EventParam("tenantId", ethereum.Value.fromFixedBytes(tenantId))
  )
  operatorMetadataUpdatedEvent.parameters.push(
    new ethereum.EventParam("operator", ethereum.Value.fromAddress(operator))
  )
  operatorMetadataUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "metadataURI",
      ethereum.Value.fromString(metadataURI)
    )
  )

  return operatorMetadataUpdatedEvent
}

export function createOperatorRecoveredEvent(
  tenantId: Bytes,
  oldOperator: Address,
  newOperator: Address,
  stakeAmount: BigInt,
  reason: string
): OperatorRecovered {
  let operatorRecoveredEvent = changetype<OperatorRecovered>(newMockEvent())

  operatorRecoveredEvent.parameters = new Array()

  operatorRecoveredEvent.parameters.push(
    new ethereum.EventParam("tenantId", ethereum.Value.fromFixedBytes(tenantId))
  )
  operatorRecoveredEvent.parameters.push(
    new ethereum.EventParam(
      "oldOperator",
      ethereum.Value.fromAddress(oldOperator)
    )
  )
  operatorRecoveredEvent.parameters.push(
    new ethereum.EventParam(
      "newOperator",
      ethereum.Value.fromAddress(newOperator)
    )
  )
  operatorRecoveredEvent.parameters.push(
    new ethereum.EventParam(
      "stakeAmount",
      ethereum.Value.fromUnsignedBigInt(stakeAmount)
    )
  )
  operatorRecoveredEvent.parameters.push(
    new ethereum.EventParam("reason", ethereum.Value.fromString(reason))
  )

  return operatorRecoveredEvent
}

export function createOperatorRecoveryAliasUpdatedEvent(
  tenantId: Bytes,
  oldOperator: Address,
  newOperator: Address,
  rootOperator: Address
): OperatorRecoveryAliasUpdated {
  let operatorRecoveryAliasUpdatedEvent =
    changetype<OperatorRecoveryAliasUpdated>(newMockEvent())

  operatorRecoveryAliasUpdatedEvent.parameters = new Array()

  operatorRecoveryAliasUpdatedEvent.parameters.push(
    new ethereum.EventParam("tenantId", ethereum.Value.fromFixedBytes(tenantId))
  )
  operatorRecoveryAliasUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "oldOperator",
      ethereum.Value.fromAddress(oldOperator)
    )
  )
  operatorRecoveryAliasUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newOperator",
      ethereum.Value.fromAddress(newOperator)
    )
  )
  operatorRecoveryAliasUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "rootOperator",
      ethereum.Value.fromAddress(rootOperator)
    )
  )

  return operatorRecoveryAliasUpdatedEvent
}

export function createOperatorRecoveryDelegateUpdatedEvent(
  tenantId: Bytes,
  operator: Address,
  delegate: Address
): OperatorRecoveryDelegateUpdated {
  let operatorRecoveryDelegateUpdatedEvent =
    changetype<OperatorRecoveryDelegateUpdated>(newMockEvent())

  operatorRecoveryDelegateUpdatedEvent.parameters = new Array()

  operatorRecoveryDelegateUpdatedEvent.parameters.push(
    new ethereum.EventParam("tenantId", ethereum.Value.fromFixedBytes(tenantId))
  )
  operatorRecoveryDelegateUpdatedEvent.parameters.push(
    new ethereum.EventParam("operator", ethereum.Value.fromAddress(operator))
  )
  operatorRecoveryDelegateUpdatedEvent.parameters.push(
    new ethereum.EventParam("delegate", ethereum.Value.fromAddress(delegate))
  )

  return operatorRecoveryDelegateUpdatedEvent
}

export function createOperatorSlashedEvent(
  tenantId: Bytes,
  operator: Address,
  amount: BigInt,
  slasher: Address,
  reason: string
): OperatorSlashed {
  let operatorSlashedEvent = changetype<OperatorSlashed>(newMockEvent())

  operatorSlashedEvent.parameters = new Array()

  operatorSlashedEvent.parameters.push(
    new ethereum.EventParam("tenantId", ethereum.Value.fromFixedBytes(tenantId))
  )
  operatorSlashedEvent.parameters.push(
    new ethereum.EventParam("operator", ethereum.Value.fromAddress(operator))
  )
  operatorSlashedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  operatorSlashedEvent.parameters.push(
    new ethereum.EventParam("slasher", ethereum.Value.fromAddress(slasher))
  )
  operatorSlashedEvent.parameters.push(
    new ethereum.EventParam("reason", ethereum.Value.fromString(reason))
  )

  return operatorSlashedEvent
}

export function createOperatorSoftSlashedEvent(
  tenantId: Bytes,
  operator: Address,
  violationCode: Bytes,
  penaltyBps: i32,
  slashedAmount: BigInt,
  remainingStake: BigInt,
  slasher: Address,
  reason: string
): OperatorSoftSlashed {
  let operatorSoftSlashedEvent = changetype<OperatorSoftSlashed>(newMockEvent())

  operatorSoftSlashedEvent.parameters = new Array()

  operatorSoftSlashedEvent.parameters.push(
    new ethereum.EventParam("tenantId", ethereum.Value.fromFixedBytes(tenantId))
  )
  operatorSoftSlashedEvent.parameters.push(
    new ethereum.EventParam("operator", ethereum.Value.fromAddress(operator))
  )
  operatorSoftSlashedEvent.parameters.push(
    new ethereum.EventParam(
      "violationCode",
      ethereum.Value.fromFixedBytes(violationCode)
    )
  )
  operatorSoftSlashedEvent.parameters.push(
    new ethereum.EventParam(
      "penaltyBps",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(penaltyBps))
    )
  )
  operatorSoftSlashedEvent.parameters.push(
    new ethereum.EventParam(
      "slashedAmount",
      ethereum.Value.fromUnsignedBigInt(slashedAmount)
    )
  )
  operatorSoftSlashedEvent.parameters.push(
    new ethereum.EventParam(
      "remainingStake",
      ethereum.Value.fromUnsignedBigInt(remainingStake)
    )
  )
  operatorSoftSlashedEvent.parameters.push(
    new ethereum.EventParam("slasher", ethereum.Value.fromAddress(slasher))
  )
  operatorSoftSlashedEvent.parameters.push(
    new ethereum.EventParam("reason", ethereum.Value.fromString(reason))
  )

  return operatorSoftSlashedEvent
}

export function createOperatorStakeToppedUpEvent(
  tenantId: Bytes,
  operator: Address,
  amount: BigInt,
  totalStake: BigInt
): OperatorStakeToppedUp {
  let operatorStakeToppedUpEvent =
    changetype<OperatorStakeToppedUp>(newMockEvent())

  operatorStakeToppedUpEvent.parameters = new Array()

  operatorStakeToppedUpEvent.parameters.push(
    new ethereum.EventParam("tenantId", ethereum.Value.fromFixedBytes(tenantId))
  )
  operatorStakeToppedUpEvent.parameters.push(
    new ethereum.EventParam("operator", ethereum.Value.fromAddress(operator))
  )
  operatorStakeToppedUpEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  operatorStakeToppedUpEvent.parameters.push(
    new ethereum.EventParam(
      "totalStake",
      ethereum.Value.fromUnsignedBigInt(totalStake)
    )
  )

  return operatorStakeToppedUpEvent
}

export function createOperatorStatusUpdatedEvent(
  tenantId: Bytes,
  operator: Address,
  isActive: boolean,
  reason: string
): OperatorStatusUpdated {
  let operatorStatusUpdatedEvent =
    changetype<OperatorStatusUpdated>(newMockEvent())

  operatorStatusUpdatedEvent.parameters = new Array()

  operatorStatusUpdatedEvent.parameters.push(
    new ethereum.EventParam("tenantId", ethereum.Value.fromFixedBytes(tenantId))
  )
  operatorStatusUpdatedEvent.parameters.push(
    new ethereum.EventParam("operator", ethereum.Value.fromAddress(operator))
  )
  operatorStatusUpdatedEvent.parameters.push(
    new ethereum.EventParam("isActive", ethereum.Value.fromBoolean(isActive))
  )
  operatorStatusUpdatedEvent.parameters.push(
    new ethereum.EventParam("reason", ethereum.Value.fromString(reason))
  )

  return operatorStatusUpdatedEvent
}

export function createOperatorUnstakeRequestedEvent(
  tenantId: Bytes,
  operator: Address,
  availableAt: BigInt
): OperatorUnstakeRequested {
  let operatorUnstakeRequestedEvent =
    changetype<OperatorUnstakeRequested>(newMockEvent())

  operatorUnstakeRequestedEvent.parameters = new Array()

  operatorUnstakeRequestedEvent.parameters.push(
    new ethereum.EventParam("tenantId", ethereum.Value.fromFixedBytes(tenantId))
  )
  operatorUnstakeRequestedEvent.parameters.push(
    new ethereum.EventParam("operator", ethereum.Value.fromAddress(operator))
  )
  operatorUnstakeRequestedEvent.parameters.push(
    new ethereum.EventParam(
      "availableAt",
      ethereum.Value.fromUnsignedBigInt(availableAt)
    )
  )

  return operatorUnstakeRequestedEvent
}

export function createOperatorUnstakedEvent(
  tenantId: Bytes,
  operator: Address,
  amount: BigInt
): OperatorUnstaked {
  let operatorUnstakedEvent = changetype<OperatorUnstaked>(newMockEvent())

  operatorUnstakedEvent.parameters = new Array()

  operatorUnstakedEvent.parameters.push(
    new ethereum.EventParam("tenantId", ethereum.Value.fromFixedBytes(tenantId))
  )
  operatorUnstakedEvent.parameters.push(
    new ethereum.EventParam("operator", ethereum.Value.fromAddress(operator))
  )
  operatorUnstakedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return operatorUnstakedEvent
}

export function createProtocolInitializedEvent(
  protocolOwner: Address
): ProtocolInitialized {
  let protocolInitializedEvent = changetype<ProtocolInitialized>(newMockEvent())

  protocolInitializedEvent.parameters = new Array()

  protocolInitializedEvent.parameters.push(
    new ethereum.EventParam(
      "protocolOwner",
      ethereum.Value.fromAddress(protocolOwner)
    )
  )

  return protocolInitializedEvent
}

export function createRoleAdminChangedEvent(
  role: Bytes,
  previousAdminRole: Bytes,
  newAdminRole: Bytes
): RoleAdminChanged {
  let roleAdminChangedEvent = changetype<RoleAdminChanged>(newMockEvent())

  roleAdminChangedEvent.parameters = new Array()

  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "previousAdminRole",
      ethereum.Value.fromFixedBytes(previousAdminRole)
    )
  )
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newAdminRole",
      ethereum.Value.fromFixedBytes(newAdminRole)
    )
  )

  return roleAdminChangedEvent
}

export function createRoleGrantedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): RoleGranted {
  let roleGrantedEvent = changetype<RoleGranted>(newMockEvent())

  roleGrantedEvent.parameters = new Array()

  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return roleGrantedEvent
}

export function createRoleRevokedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): RoleRevoked {
  let roleRevokedEvent = changetype<RoleRevoked>(newMockEvent())

  roleRevokedEvent.parameters = new Array()

  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return roleRevokedEvent
}

export function createTenantCreatedEvent(
  tenantId: Bytes,
  admin: Address,
  manager: Address,
  treasury: Address
): TenantCreated {
  let tenantCreatedEvent = changetype<TenantCreated>(newMockEvent())

  tenantCreatedEvent.parameters = new Array()

  tenantCreatedEvent.parameters.push(
    new ethereum.EventParam("tenantId", ethereum.Value.fromFixedBytes(tenantId))
  )
  tenantCreatedEvent.parameters.push(
    new ethereum.EventParam("admin", ethereum.Value.fromAddress(admin))
  )
  tenantCreatedEvent.parameters.push(
    new ethereum.EventParam("manager", ethereum.Value.fromAddress(manager))
  )
  tenantCreatedEvent.parameters.push(
    new ethereum.EventParam("treasury", ethereum.Value.fromAddress(treasury))
  )

  return tenantCreatedEvent
}

export function createTenantStatusUpdatedEvent(
  tenantId: Bytes,
  isActive: boolean
): TenantStatusUpdated {
  let tenantStatusUpdatedEvent = changetype<TenantStatusUpdated>(newMockEvent())

  tenantStatusUpdatedEvent.parameters = new Array()

  tenantStatusUpdatedEvent.parameters.push(
    new ethereum.EventParam("tenantId", ethereum.Value.fromFixedBytes(tenantId))
  )
  tenantStatusUpdatedEvent.parameters.push(
    new ethereum.EventParam("isActive", ethereum.Value.fromBoolean(isActive))
  )

  return tenantStatusUpdatedEvent
}

export function createTreasuryUpdatedEvent(
  tenantId: Bytes,
  oldTreasury: Address,
  newTreasury: Address
): TreasuryUpdated {
  let treasuryUpdatedEvent = changetype<TreasuryUpdated>(newMockEvent())

  treasuryUpdatedEvent.parameters = new Array()

  treasuryUpdatedEvent.parameters.push(
    new ethereum.EventParam("tenantId", ethereum.Value.fromFixedBytes(tenantId))
  )
  treasuryUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "oldTreasury",
      ethereum.Value.fromAddress(oldTreasury)
    )
  )
  treasuryUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newTreasury",
      ethereum.Value.fromAddress(newTreasury)
    )
  )

  return treasuryUpdatedEvent
}

export function createUnstakeCooldownUpdatedEvent(
  tenantId: Bytes,
  oldValue: BigInt,
  newValue: BigInt
): UnstakeCooldownUpdated {
  let unstakeCooldownUpdatedEvent =
    changetype<UnstakeCooldownUpdated>(newMockEvent())

  unstakeCooldownUpdatedEvent.parameters = new Array()

  unstakeCooldownUpdatedEvent.parameters.push(
    new ethereum.EventParam("tenantId", ethereum.Value.fromFixedBytes(tenantId))
  )
  unstakeCooldownUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "oldValue",
      ethereum.Value.fromUnsignedBigInt(oldValue)
    )
  )
  unstakeCooldownUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newValue",
      ethereum.Value.fromUnsignedBigInt(newValue)
    )
  )

  return unstakeCooldownUpdatedEvent
}

export function createViolationPenaltyUpdatedEvent(
  tenantId: Bytes,
  violationCode: Bytes,
  oldPenaltyBps: i32,
  newPenaltyBps: i32
): ViolationPenaltyUpdated {
  let violationPenaltyUpdatedEvent =
    changetype<ViolationPenaltyUpdated>(newMockEvent())

  violationPenaltyUpdatedEvent.parameters = new Array()

  violationPenaltyUpdatedEvent.parameters.push(
    new ethereum.EventParam("tenantId", ethereum.Value.fromFixedBytes(tenantId))
  )
  violationPenaltyUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "violationCode",
      ethereum.Value.fromFixedBytes(violationCode)
    )
  )
  violationPenaltyUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "oldPenaltyBps",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(oldPenaltyBps))
    )
  )
  violationPenaltyUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newPenaltyBps",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(newPenaltyBps))
    )
  )

  return violationPenaltyUpdatedEvent
}
