import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Bytes, BigInt, Address } from "@graphprotocol/graph-ts"
import { CoSignOperatorConfigured } from "../generated/schema"
import { CoSignOperatorConfigured as CoSignOperatorConfiguredEvent } from "../generated/VoucherProtocol/VoucherProtocol"
import { handleCoSignOperatorConfigured } from "../src/voucher-protocol"
import { createCoSignOperatorConfiguredEvent } from "./voucher-protocol-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let tenantId = Bytes.fromI32(1234567890)
    let docType = BigInt.fromI32(234)
    let operator = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let whitelisted = "boolean Not implemented"
    let roleId = 123
    let newCoSignOperatorConfiguredEvent = createCoSignOperatorConfiguredEvent(
      tenantId,
      docType,
      operator,
      whitelisted,
      roleId
    )
    handleCoSignOperatorConfigured(newCoSignOperatorConfiguredEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("CoSignOperatorConfigured created and stored", () => {
    assert.entityCount("CoSignOperatorConfigured", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "CoSignOperatorConfigured",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "tenantId",
      "1234567890"
    )
    assert.fieldEquals(
      "CoSignOperatorConfigured",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "docType",
      "234"
    )
    assert.fieldEquals(
      "CoSignOperatorConfigured",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "operator",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "CoSignOperatorConfigured",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "whitelisted",
      "boolean Not implemented"
    )
    assert.fieldEquals(
      "CoSignOperatorConfigured",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "roleId",
      "123"
    )

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})
