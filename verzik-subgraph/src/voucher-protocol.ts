import {
  CoSignOperatorConfigured as CoSignOperatorConfiguredEvent,
  CoSignPolicyUpdated as CoSignPolicyUpdatedEvent,
  DocumentAnchored as DocumentAnchoredEvent,
  DocumentCoSignQualified as DocumentCoSignQualifiedEvent,
  DocumentCoSigned as DocumentCoSignedEvent,
  DocumentRevoked as DocumentRevokedEvent,
  MinOperatorStakeUpdated as MinOperatorStakeUpdatedEvent,
  NonceConsumed as NonceConsumedEvent,
  OperatorJoined as OperatorJoinedEvent,
  OperatorMetadataUpdated as OperatorMetadataUpdatedEvent,
  OperatorRecovered as OperatorRecoveredEvent,
  OperatorRecoveryAliasUpdated as OperatorRecoveryAliasUpdatedEvent,
  OperatorRecoveryDelegateUpdated as OperatorRecoveryDelegateUpdatedEvent,
  OperatorSlashed as OperatorSlashedEvent,
  OperatorSoftSlashed as OperatorSoftSlashedEvent,
  OperatorStakeToppedUp as OperatorStakeToppedUpEvent,
  OperatorStatusUpdated as OperatorStatusUpdatedEvent,
  OperatorUnstakeRequested as OperatorUnstakeRequestedEvent,
  OperatorUnstaked as OperatorUnstakedEvent,
  ProtocolInitialized as ProtocolInitializedEvent,
  RoleAdminChanged as RoleAdminChangedEvent,
  RoleGranted as RoleGrantedEvent,
  RoleRevoked as RoleRevokedEvent,
  TenantCreated as TenantCreatedEvent,
  TenantStatusUpdated as TenantStatusUpdatedEvent,
  TreasuryUpdated as TreasuryUpdatedEvent,
  UnstakeCooldownUpdated as UnstakeCooldownUpdatedEvent,
  ViolationPenaltyUpdated as ViolationPenaltyUpdatedEvent
} from "../generated/VoucherProtocol/VoucherProtocol"
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
} from "../generated/schema"

export function handleCoSignOperatorConfigured(
  event: CoSignOperatorConfiguredEvent
): void {
  let entity = new CoSignOperatorConfigured(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tenantId = event.params.tenantId
  entity.docType = event.params.docType
  entity.operator = event.params.operator
  entity.whitelisted = event.params.whitelisted
  entity.roleId = event.params.roleId

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleCoSignPolicyUpdated(
  event: CoSignPolicyUpdatedEvent
): void {
  let entity = new CoSignPolicyUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tenantId = event.params.tenantId
  entity.docType = event.params.docType
  entity.enabled = event.params.enabled
  entity.minStake = event.params.minStake
  entity.minSigners = event.params.minSigners
  entity.requiredRoleMask = event.params.requiredRoleMask

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDocumentAnchored(event: DocumentAnchoredEvent): void {
  let entity = new DocumentAnchored(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tenantId = event.params.tenantId
  entity.fileHash = event.params.fileHash
  entity.owner = event.params.owner
  entity.cid = event.params.cid
  entity.issuer = event.params.issuer
  entity.ciphertextHash = event.params.ciphertextHash
  entity.encryptionMetaHash = event.params.encryptionMetaHash
  entity.docType = event.params.docType
  entity.version = event.params.version

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDocumentCoSignQualified(
  event: DocumentCoSignQualifiedEvent
): void {
  let entity = new DocumentCoSignQualified(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tenantId = event.params.tenantId
  entity.fileHash = event.params.fileHash
  entity.trustedSigners = event.params.trustedSigners
  entity.roleMask = event.params.roleMask

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDocumentCoSigned(event: DocumentCoSignedEvent): void {
  let entity = new DocumentCoSigned(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tenantId = event.params.tenantId
  entity.fileHash = event.params.fileHash
  entity.signer = event.params.signer
  entity.totalSigners = event.params.totalSigners

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDocumentRevoked(event: DocumentRevokedEvent): void {
  let entity = new DocumentRevoked(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tenantId = event.params.tenantId
  entity.fileHash = event.params.fileHash
  entity.revoker = event.params.revoker
  entity.reason = event.params.reason

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMinOperatorStakeUpdated(
  event: MinOperatorStakeUpdatedEvent
): void {
  let entity = new MinOperatorStakeUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tenantId = event.params.tenantId
  entity.oldValue = event.params.oldValue
  entity.newValue = event.params.newValue

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleNonceConsumed(event: NonceConsumedEvent): void {
  let entity = new NonceConsumed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tenantId = event.params.tenantId
  entity.signer = event.params.signer
  entity.oldNonce = event.params.oldNonce
  entity.newNonce = event.params.newNonce

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOperatorJoined(event: OperatorJoinedEvent): void {
  let entity = new OperatorJoined(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tenantId = event.params.tenantId
  entity.operator = event.params.operator
  entity.metadata = event.params.metadata
  entity.stake = event.params.stake

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOperatorMetadataUpdated(
  event: OperatorMetadataUpdatedEvent
): void {
  let entity = new OperatorMetadataUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tenantId = event.params.tenantId
  entity.operator = event.params.operator
  entity.metadataURI = event.params.metadataURI

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOperatorRecovered(event: OperatorRecoveredEvent): void {
  let entity = new OperatorRecovered(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tenantId = event.params.tenantId
  entity.oldOperator = event.params.oldOperator
  entity.newOperator = event.params.newOperator
  entity.stakeAmount = event.params.stakeAmount
  entity.reason = event.params.reason

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOperatorRecoveryAliasUpdated(
  event: OperatorRecoveryAliasUpdatedEvent
): void {
  let entity = new OperatorRecoveryAliasUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tenantId = event.params.tenantId
  entity.oldOperator = event.params.oldOperator
  entity.newOperator = event.params.newOperator
  entity.rootOperator = event.params.rootOperator

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOperatorRecoveryDelegateUpdated(
  event: OperatorRecoveryDelegateUpdatedEvent
): void {
  let entity = new OperatorRecoveryDelegateUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tenantId = event.params.tenantId
  entity.operator = event.params.operator
  entity.delegate = event.params.delegate

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOperatorSlashed(event: OperatorSlashedEvent): void {
  let entity = new OperatorSlashed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tenantId = event.params.tenantId
  entity.operator = event.params.operator
  entity.amount = event.params.amount
  entity.slasher = event.params.slasher
  entity.reason = event.params.reason

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOperatorSoftSlashed(
  event: OperatorSoftSlashedEvent
): void {
  let entity = new OperatorSoftSlashed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tenantId = event.params.tenantId
  entity.operator = event.params.operator
  entity.violationCode = event.params.violationCode
  entity.penaltyBps = event.params.penaltyBps
  entity.slashedAmount = event.params.slashedAmount
  entity.remainingStake = event.params.remainingStake
  entity.slasher = event.params.slasher
  entity.reason = event.params.reason

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOperatorStakeToppedUp(
  event: OperatorStakeToppedUpEvent
): void {
  let entity = new OperatorStakeToppedUp(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tenantId = event.params.tenantId
  entity.operator = event.params.operator
  entity.amount = event.params.amount
  entity.totalStake = event.params.totalStake

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOperatorStatusUpdated(
  event: OperatorStatusUpdatedEvent
): void {
  let entity = new OperatorStatusUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tenantId = event.params.tenantId
  entity.operator = event.params.operator
  entity.isActive = event.params.isActive
  entity.reason = event.params.reason

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOperatorUnstakeRequested(
  event: OperatorUnstakeRequestedEvent
): void {
  let entity = new OperatorUnstakeRequested(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tenantId = event.params.tenantId
  entity.operator = event.params.operator
  entity.availableAt = event.params.availableAt

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOperatorUnstaked(event: OperatorUnstakedEvent): void {
  let entity = new OperatorUnstaked(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tenantId = event.params.tenantId
  entity.operator = event.params.operator
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleProtocolInitialized(
  event: ProtocolInitializedEvent
): void {
  let entity = new ProtocolInitialized(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.protocolOwner = event.params.protocolOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleAdminChanged(event: RoleAdminChangedEvent): void {
  let entity = new RoleAdminChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.role = event.params.role
  entity.previousAdminRole = event.params.previousAdminRole
  entity.newAdminRole = event.params.newAdminRole

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleGranted(event: RoleGrantedEvent): void {
  let entity = new RoleGranted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.role = event.params.role
  entity.account = event.params.account
  entity.sender = event.params.sender

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRoleRevoked(event: RoleRevokedEvent): void {
  let entity = new RoleRevoked(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.role = event.params.role
  entity.account = event.params.account
  entity.sender = event.params.sender

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTenantCreated(event: TenantCreatedEvent): void {
  let entity = new TenantCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tenantId = event.params.tenantId
  entity.admin = event.params.admin
  entity.manager = event.params.manager
  entity.treasury = event.params.treasury

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTenantStatusUpdated(
  event: TenantStatusUpdatedEvent
): void {
  let entity = new TenantStatusUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tenantId = event.params.tenantId
  entity.isActive = event.params.isActive

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTreasuryUpdated(event: TreasuryUpdatedEvent): void {
  let entity = new TreasuryUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tenantId = event.params.tenantId
  entity.oldTreasury = event.params.oldTreasury
  entity.newTreasury = event.params.newTreasury

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUnstakeCooldownUpdated(
  event: UnstakeCooldownUpdatedEvent
): void {
  let entity = new UnstakeCooldownUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tenantId = event.params.tenantId
  entity.oldValue = event.params.oldValue
  entity.newValue = event.params.newValue

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleViolationPenaltyUpdated(
  event: ViolationPenaltyUpdatedEvent
): void {
  let entity = new ViolationPenaltyUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.tenantId = event.params.tenantId
  entity.violationCode = event.params.violationCode
  entity.oldPenaltyBps = event.params.oldPenaltyBps
  entity.newPenaltyBps = event.params.newPenaltyBps

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
