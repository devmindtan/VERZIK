/**
 * ProtocolAdminCLI — Quyền PROTOCOL_ADMIN_ROLE
 * Hàm đặc quyền: createTenant, setTenantStatus
 */
import { BlockchainClient } from "@verzik/sdk";
import { BaseTestCLI } from "./base";

export class ProtocolAdminCLI extends BaseTestCLI {
  constructor(client: BlockchainClient) {
    super(client);
  }

  protected printRoleMenu(): void {
    console.log("\n=== PROTOCOL ADMIN ===");
    console.log("20. Tạo Tenant mới");
    console.log("21. Bật / Tắt Tenant");
  }

  protected async handleRoleChoice(choice: number): Promise<boolean> {
    try {
      switch (choice) {
        case 20:
          await this.handleCreateTenant();
          break;
        case 21:
          await this.handleSetTenantStatus();
          break;
        default:
          console.log("⚠️  Lựa chọn không hợp lệ.");
      }
    } catch (error: any) {
      console.error("❌ Lỗi:", error.message ?? error);
    }
    return true; // tiếp tục vòng lặp
  }

  // ─────────────────────────────────────────────
  // HANDLERS PROTOCOL ADMIN
  // ─────────────────────────────────────────────

  private async handleCreateTenant() {
    const tenantName = await this.rl.question(
      "🔹 Tên Tenant (dùng để sinh ID): ",
    );
    const treasuryAddress = await this.rl.question("🔹 Địa chỉ Treasury: ");
    const adminAddress = await this.rl.question("🔹 Địa chỉ Admin: ");
    const opManagerAddress = await this.rl.question(
      "🔹 Địa chỉ Operator Manager: ",
    );
    const minStakeEth = await this.rl.question(
      "🔹 Min Stake (ETH, ví dụ 0.1): ",
    );
    const cooldownSec = await this.rl.question(
      "🔹 Unstake Cooldown (giây, ví dụ 86400): ",
    );

    const txHash = await this.client.createTenant(tenantName, treasuryAddress, {
      admin: adminAddress,
      operatorManager: opManagerAddress,
      minStake: minStakeEth,
      unstakeCooldown: BigInt(cooldownSec),
    });

    console.log(`✅ Tenant đã tạo! TX: ${txHash}`);
  }

  private async handleSetTenantStatus() {
    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const active = await this.rl.question("🔹 Bật (true) hay Tắt (false): ");

    const txHash = await this.client.setTenantStatus(
      tenantId,
      active.trim().toLowerCase() === "true",
    );
    console.log(`✅ Cập nhật trạng thái Tenant! TX: ${txHash}`);
  }
}
