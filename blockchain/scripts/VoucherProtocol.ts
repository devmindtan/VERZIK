import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("VoucherProtocolModule", (m) => {
  // Deploy external libraries first
  const operatorLib = m.library("OperatorLib");
  const documentLib = m.library("DocumentLib");
  const coSignLib = m.library("CoSignLib");
  const recoveryLib = m.library("RecoveryLib");

  // Link libraries to VoucherProtocol
  const voucherProtocol = m.contract("VoucherProtocol", [], {
    libraries: {
      OperatorLib: operatorLib,
      DocumentLib: documentLib,
      CoSignLib: coSignLib,
      RecoveryLib: recoveryLib,
    },
  });

  const voucherProtocolReader = m.contract("VoucherProtocolReader", [
    voucherProtocol,
  ]);

  return {
    operatorLib,
    documentLib,
    coSignLib,
    recoveryLib,
    voucherProtocol,
    voucherProtocolReader,
  };
});
