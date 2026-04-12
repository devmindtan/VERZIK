/**
 * TenantManagerCLI — Quyền TENANT_OPERATOR_MANAGER_ROLE
 * Hàm đặc quyền:
 *   setOperatorStatus, recoverOperatorByAdmin,
 *   setCoSignPolicy, setCoSignOperator,
 *   setMinOperatorStake, setUnstakeCooldown, setViolationPenalty,
 *   slashOperator, softSlashOperator
 */
import { BlockchainClient } from "@verzik/sdk";
import { BaseTestCLI } from "./base";

export class TenantManagerCLI extends BaseTestCLI {
  constructor(client: BlockchainClient) {
    super(client);
  }

  protected printRoleMenu(): void {
    console.log("\n=== TENANT OPERATOR MANAGER ===");
    console.log("20. Cập nhật trạng thái Operator (bật/tắt)");
    console.log("21. Khôi phục Operator (Admin recovery)");
    console.log("22. Cấu hình Co-Sign Policy");
    console.log("23. Cấu hình Co-Sign Operator (whitelist + role)");
    console.log("24. Cập nhật Stake tối thiểu");
    console.log("25. Cập nhật Cooldown Unstake");
    console.log("26. Cấu hình mức phạt vi phạm");
    console.log("27. Hard Slash Operator (100% stake)");
    console.log("28. Soft Slash Operator (theo violation code)");
  }

  protected async handleRoleChoice(choice: number): Promise<boolean> {
    try {
      switch (choice) {
        case 20:
          await this.handleSetOperatorStatus();
          break;
        case 21:
          await this.handleRecoverOperatorByAdmin();
          break;
        case 22:
          await this.handleSetCoSignPolicy();
          break;
        case 23:
          await this.handleSetCoSignOperator();
          break;
        case 24:
          await this.handleSetMinOperatorStake();
          break;
        case 25:
          await this.handleSetUnstakeCooldown();
          break;
        case 26:
          await this.handleSetViolationPenalty();
          break;
        case 27:
          await this.handleSlashOperator();
          break;
        case 28:
          await this.handleSoftSlashOperator();
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
  // HANDLERS OPERATOR MANAGER
  // ─────────────────────────────────────────────

  private async handleSetOperatorStatus() {
    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const operator = await this.rl.question("🔹 Địa chỉ Operator: ");
    const active = await this.rl.question("🔹 Bật (true) hay Tắt (false): ");
    const reason = await this.rl.question("🔹 Lý do: ");

    const txHash = await this.client.setOperatorStatus(
      tenantId,
      operator,
      active.trim().toLowerCase() === "true",
      reason,
    );
    console.log(`✅ Cập nhật trạng thái Operator! TX: ${txHash}`);
  }

  private async handleRecoverOperatorByAdmin() {
    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const lostOperator = await this.rl.question(
      "🔹 Địa chỉ Operator cũ (bị mất): ",
    );
    const newOperator = await this.rl.question("🔹 Địa chỉ Operator mới: ");
    const reason = await this.rl.question("🔹 Lý do recovery: ");

    const txHash = await this.client.recoverOperatorByAdmin(
      tenantId,
      lostOperator,
      newOperator,
      reason,
    );
    console.log(`✅ Recovery thành công! TX: ${txHash}`);
  }

  private async handleSetCoSignPolicy() {
    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const docType = await this.rl.question("🔹 Doc Type (số): ");
    const enabled = await this.rl.question("🔹 Bật policy? (true/false): ");
    const minStake = await this.rl.question("🔹 Min Stake (ETH, ví dụ 0.1): ");
    const minSigners = await this.rl.question("🔹 Min Signers (số): ");
    const requiredRoleMask = await this.rl.question(
      "🔹 Required Role Mask (số, ví dụ 0): ",
    );

    const txHash = await this.client.setCoSignPolicy(
      tenantId,
      Number(docType),
      enabled.trim().toLowerCase() === "true",
      minStake,
      BigInt(minSigners),
      BigInt(requiredRoleMask),
    );
    console.log(`✅ Đã cập nhật Co-Sign Policy! TX: ${txHash}`);
  }

  private async handleSetCoSignOperator() {
    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const docType = await this.rl.question("🔹 Doc Type (số): ");
    const operator = await this.rl.question("🔹 Địa chỉ Operator: ");
    const whitelisted = await this.rl.question(
      "🔹 Thêm vào whitelist? (true/false): ",
    );
    const roleId = await this.rl.question("🔹 Role ID (1-256): ");

    const txHash = await this.client.setCoSignOperator(
      tenantId,
      Number(docType),
      operator,
      whitelisted.trim().toLowerCase() === "true",
      Number(roleId),
    );
    console.log(`✅ Đã cấu hình Co-Sign Operator! TX: ${txHash}`);
  }

  private async handleSetMinOperatorStake() {
    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const minStake = await this.rl.question(
      "🔹 Min Stake mới (ETH, ví dụ 0.1): ",
    );

    const txHash = await this.client.setMinOperatorStake(tenantId, minStake);
    console.log(`✅ Đã cập nhật Min Operator Stake! TX: ${txHash}`);
  }

  private async handleSlashOperator() {
    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const operator = await this.rl.question("🔹 Địa chỉ Operator cần slash: ");
    const reason = await this.rl.question("🔹 Lý do: ");

    const txHash = await this.client.slashOperator(tenantId, operator, reason);
    console.log(`✅ Hard Slash thành công! TX: ${txHash}`);
  }

  private async handleSoftSlashOperator() {
    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const operator = await this.rl.question("🔹 Địa chỉ Operator: ");
    const violationCode = await this.rl.question(
      "🔹 Violation Code (bytes32): ",
    );
    const reason = await this.rl.question("🔹 Lý do: ");

    const txHash = await this.client.softSlashOperator(
      tenantId,
      operator,
      violationCode,
      reason,
    );
    console.log(`✅ Soft Slash thành công! TX: ${txHash}`);
  }

  private async handleSetUnstakeCooldown() {
    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const cooldown = await this.rl.question(
      "🔹 Cooldown mới (giây, ví dụ 86400): ",
    );

    const txHash = await this.client.setUnstakeCooldown(
      tenantId,
      BigInt(cooldown),
    );
    console.log(`✅ Đã cập nhật Unstake Cooldown! TX: ${txHash}`);
  }

  private async handleSetViolationPenalty() {
    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const violationCode = await this.rl.question(
      "🔹 Violation Code (bytes32): ",
    );
    const penaltyBps = await this.rl.question("🔹 Penalty BPS (1-10000): ");

    const txHash = await this.client.setViolationPenalty(
      tenantId,
      violationCode,
      Number(penaltyBps),
    );
    console.log(`✅ Đã cấu hình mức phạt vi phạm! TX: ${txHash}`);
  }
}
