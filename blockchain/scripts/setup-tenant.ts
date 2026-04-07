import {
  keccak256,
  toBytes,
  padHex,
  isHex,
  createPublicClient,
  createWalletClient,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import hre from "hardhat";

// --- Helper: chuẩn hoá chuỗi thành bytes32 hợp lệ ---
function toBytes32(value: string): `0x${string}` {
  // Nếu đã là hex 32 bytes (66 ký tự) thì dùng thẳng.
  if (isHex(value) && value.length === 66) {
    return value as `0x${string}`;
  }
  // Nếu là hex ngắn thì pad phải lên đủ 32 bytes.
  if (isHex(value)) {
    return padHex(value as `0x${string}`, { size: 32 });
  }
  // Nếu là string thường thì băm keccak256 để ra bytes32.
  return keccak256(toBytes(value));
}

async function main() {
  console.log("=== Setup Tenant: Creating Tenant Instance ===");

  // --- Đọc biến môi trường ---
  const protocolAddress = "0x68B1D87F95878fE05B998F19b66F4baba5De1aed";
  const rawTenantId = "VERZIK";
  const tenantAdmin = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8"; // địa chỉ ví của SaaS admin
  const tenantTreasury = "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc"; // địa chỉ ví treasury (tuỳ chọn)
  const deployerKey =
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // private key protocol owner để ký tx

  // --- Validate bắt buộc ---
  if (!protocolAddress) {
    console.error("❌ Missing PROTOCOL_ADDRESS");
    process.exit(1);
  }
  if (!tenantAdmin) {
    console.error("❌ Missing TENANT_ADMIN (địa chỉ ví)");
    process.exit(1);
  }
  if (!deployerKey) {
    console.error("❌ Missing DEPLOYER_PRIVATE_KEY");
    process.exit(1);
  }

  // --- Treasury fallback về admin nếu không truyền ---
  const treasury = tenantTreasury ?? tenantAdmin;

  // --- Xử lý tenantId ---
  let tenantId: `0x${string}`;
  if (rawTenantId) {
    tenantId = toBytes32(rawTenantId);
    console.log(`\n🏷️  Tenant ID (từ env):         ${rawTenantId}`);
    console.log(`   Tenant ID (bytes32):         ${tenantId}`);
  } else {
    tenantId = keccak256(toBytes(`${tenantAdmin}-${Date.now()}`));
    console.log(`\n🏷️  Tenant ID (auto-generated):  ${tenantId}`);
    console.log(`   ⚠️  Lưu lại ID này để dùng khi tương tác sau!`);
  }

  console.log(`\n📋 Configuration:`);
  console.log(`   Protocol : ${protocolAddress}`);
  console.log(`   Tenant ID: ${tenantId}`);
  console.log(`   Admin    : ${tenantAdmin}`);
  console.log(`   Treasury : ${treasury}`);

  try {
    // --- Lấy RPC URL & chainId (env var ưu tiên, fallback về k3s) ---
    const rpcUrl = process.env.RPC_URL ?? "http://100.114.63.52:30545";
    const chainId = parseInt(process.env.CHAIN_ID ?? "31337", 10);

    // --- Tạo chain config ---
    const chain = {
      id: chainId,
      name: "k3s",
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrls: { default: { http: [rpcUrl] } },
    } as const;

    // --- Khởi tạo account và clients ---
    const account = privateKeyToAccount(deployerKey as `0x${string}`);
    const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(rpcUrl),
    });

    console.log(`\n🔑 Deployer: ${account.address}`);

    // --- Đọc ABI từ artifact ---
    const artifact = await hre.artifacts.readArtifact("VoucherProtocol");

    // --- Gọi createTenant với địa chỉ ví trực tiếp ---
    const hash = await walletClient.writeContract({
      address: protocolAddress as `0x${string}`,
      abi: artifact.abi,
      functionName: "createTenant",
      args: [tenantId, tenantAdmin as `0x${string}`, treasury as `0x${string}`],
    });

    console.log(`\n⏳ Transaction hash: ${hash}`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    console.log(`\n✅ Tenant created successfully!`);
    console.log(`   Block    : ${receipt.blockNumber}`);
    console.log(`   Gas used : ${receipt.gasUsed}`);
    console.log(`\n📌 Lưu lại thông tin sau để dùng SDK:`);
    console.log(`   PROTOCOL_ADDRESS=${protocolAddress}`);
    console.log(`   TENANT_ID=${tenantId}`);
    console.log(`   TENANT_ADMIN=${tenantAdmin}`);
  } catch (error: any) {
    console.error(
      "\n❌ Setup failed:",
      error?.shortMessage ?? error?.message ?? error,
    );
    process.exit(1);
  }
}

main();
