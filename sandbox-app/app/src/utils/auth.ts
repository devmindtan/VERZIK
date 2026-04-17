import type { AccountSnapshot } from "./types";
import { Wallet, JsonRpcProvider, formatEther } from "ethers";
import type { WalletSession } from "../components/access";
import {
  checkPermission,
  type PermissionRole,
} from "../services/blockchain.permission.service";

function buildSessionFromPermission(
  address: string,
  role: PermissionRole,
): WalletSession {
  switch (role) {
    case "PROTOCOL_OWNER":
      return {
        id: `owner-${address.toLowerCase()}`,
        label: "Owner / Root",
        address,
        primaryRole: "owner",
        tenantRole: null,
      };
    case "TENANT_ADMIN":
      return {
        id: `tenant-admin-${address.toLowerCase()}`,
        label: "Tenant Admin",
        address,
        primaryRole: "tenant",
        tenantRole: "admin",
      };
    case "TENANT_OPERATOR":
      return {
        id: `tenant-operator-${address.toLowerCase()}`,
        label: "Tenant Operator",
        address,
        primaryRole: "tenant",
        tenantRole: "manager",
      };
    case "TENANT_TREASURY":
      return {
        id: `tenant-treasury-${address.toLowerCase()}`,
        label: "Tenant Treasury",
        address,
        primaryRole: "tenant",
        tenantRole: "treasury",
      };
    case "OPERATOR":
      return {
        id: `operator-${address.toLowerCase()}`,
        label: "Operator",
        address,
        primaryRole: "operator",
        tenantRole: null,
      };
    default:
      return {
        id: `guest-${address.toLowerCase()}`,
        label: "Ví không có quyền",
        address,
        primaryRole: "guest",
        tenantRole: null,
      };
  }
}

export async function loadAccountSnapshot(
  privateKey: string,
): Promise<AccountSnapshot> {
  const sanitized = privateKey.trim();
  const normalized = sanitized.startsWith("0x") ? sanitized : `0x${sanitized}`;

  const RPC_URL = "https://hardhat.devmindtan.uk";
  const provider = new JsonRpcProvider(RPC_URL);

  let wallet: Wallet;
  try {
    wallet = new Wallet(normalized, provider);
  } catch {
    throw new Error("Không thể khởi tạo ví từ private key.");
  }

  const address = wallet.address;

  const [role, balanceWei, network] = await Promise.all([
    checkPermission(normalized),
    provider.getBalance(address),
    provider.getNetwork(),
  ]);

  if (!role) {
    throw new Error("Không lấy được quyền từ API check permission.");
  }

  const session = buildSessionFromPermission(address, role);

  const displayNetworkName =
    network.name === "unknown"
      ? `CHAIN-${network.chainId}`
      : network.name.toUpperCase();

  return {
    session,
    tenants: [],
    operators: [],
    balanceEth: formatEther(balanceWei),
    networkName: displayNetworkName,
  };
}
