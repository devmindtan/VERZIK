/**
 * TenantAdminCLI — Quyền TENANT_ADMIN_ROLE
 * Hàm đặc quyền: setTreasury, revokeDocument
 */
import { BlockchainClient } from "@verzik/sdk";
import { BaseTestCLI } from "./base";

export class TenantAdminCLI extends BaseTestCLI {
  constructor(client: BlockchainClient) {
    super(client);
  }

  protected printRoleMenu(): void {
    console.log("\n=== TENANT ADMIN ===");
    console.log("20. Cập nhật Treasury");
    console.log("21. Thu hồi tài liệu");
  }

  protected async handleRoleChoice(choice: number): Promise<boolean> {
    try {
      switch (choice) {
        case 20:
          await this.handleSetTreasury();
          break;
        case 21:
          await this.handleRevokeDocument();
          break;
        default:
          console.log("⚠️  Lựa chọn không hợp lệ.");
      }
    } catch (error: any) {
      console.error("❌ Lỗi:", error.message ?? error);
    }
    return true;
  }

  // ─────────────────────────────────────────────
  // HANDLERS TENANT ADMIN
  // ─────────────────────────────────────────────

  private async handleSetTreasury() {
    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const newTreasury = await this.rl.question("🔹 Địa chỉ Treasury mới: ");

    const txHash = await this.client.setTreasury(tenantId, newTreasury);
    console.log(`✅ Đã cập nhật Treasury! TX: ${txHash}`);
  }

  private async handleRevokeDocument() {
    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const fileHash = await this.rl.question("🔹 Nhập File Hash (bytes32): ");
    const reason = await this.rl.question("🔹 Lý do thu hồi: ");

    const txHash = await this.client.revokeDocument(tenantId, fileHash, reason);
    console.log(`✅ Đã thu hồi tài liệu! TX: ${txHash}`);
  }
}
