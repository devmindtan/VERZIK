import { ethers } from "ethers";
import { createBlockchainContext } from "@verzik/sdk";
import dotenv from "dotenv";
import { BlockchainQueryService } from "./blockchain.query.service";
dotenv.config();
const queryService = new BlockchainQueryService();

export async function checkPermission(address: string): Promise<string> {
  const userAddress = address.toLowerCase(); // Chuyển lowercase 1 lần ở đầu để dùng chung

  const contract = createBlockchainContext({
    rpcUrl: process.env.RPC_URL || "",
    protocolAddress: process.env.PROTOCOL_ADDRESS || "",
    readerAddress: process.env.READER_ADDRESS,
  });

  // --- Check quyền Super Admin (On-chain) ---
  const PROTOCOL_ADMIN_ROLE = ethers.id("PROTOCOL_ADMIN_ROLE");
  const isSuperAdmin = await contract.protocolContract.hasRole(
    PROTOCOL_ADMIN_ROLE,
    userAddress,
  );

  if (isSuperAdmin) {
    return "PROTOCOL_OWNER";
  }

  // --- Check quyền Tenant (từ Subgraph) ---
  const userTenants = await queryService.getTenantsByUsers(userAddress);

  if (userTenants && userTenants.length > 0) {
    for (const tenant of userTenants) {
      const admin = tenant.admin.toLowerCase();
      const manager = tenant.manager.toLowerCase();
      const treasury = tenant.treasury.toLowerCase();

      if (admin === userAddress) return "TENANT_ADMIN";
      if (manager === userAddress) return "TENANT_MANAGER";
      if (treasury === userAddress) return "TENANT_TREASURY";
    }
  }

  // --- Check quyền Operator (từ Subgraph) ---
  const userOperators = await queryService.getOperatorByUsers(userAddress);
  if (userOperators && userOperators.length > 0) {
    for (const op of userOperators) {
      const found = op.operator.toLowerCase();

      if (found === userAddress) return "OPERATOR";
    }
  }
  return "GUEST";
}
