/**
 * BaseTestCLI — Class trừu tượng chứa toàn bộ hàm READ-ONLY (không tốn phí gas).
 * Mọi role (ProtocolAdmin, TenantAdmin, OperatorManager, Operator) đều kế thừa.
 */
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { BlockchainClient } from "@verzik/sdk";

// ─── Helpers hiển thị ─────────────────────────────────────────
const ZERO_ADDR = "0x0000000000000000000000000000000000000000";
function fmtDate(ts: bigint | number): string {
  if (!ts) return "—";
  return new Date(Number(ts) * 1000).toLocaleString("vi-VN");
}
function fmtBool(v: boolean): string {
  return v ? "✅ Có" : "❌ Không";
}
function fmtSecs(s: bigint): string {
  const h = Number(s) / 3600;
  return `${s}s (${h.toFixed(1)} giờ)`;
}
function sep(char = "─", len = 54): void {
  console.log("  " + char.repeat(len));
}
// ──────────────────────────────────────────────────────────────

export abstract class BaseTestCLI {
  protected client: BlockchainClient;
  protected rl: readline.Interface;

  constructor(client: BlockchainClient) {
    this.client = client;
    this.rl = readline.createInterface({ input, output });
  }

  // ─────────────────────────────────────────────
  // MENU CHUNG (read-only)
  // ─────────────────────────────────────────────
  protected printCommonMenu(): void {
    console.log("\n=== READ-ONLY (tất cả quyền) ===");
    console.log(" 1. Xem số lượng Tenant");
    console.log(" 2. Xem danh sách Tenant");
    console.log(" 3. Xem thông tin Tenant");
    console.log(" 4. Xem số lượng Operator");
    console.log(" 5. Xem danh sách Operator");
    console.log(" 6. Xem trạng thái Operator");
    console.log(" 7. Xem trạng thái tài liệu");
    console.log(" 8. Xác thực tài liệu (verify)");
    console.log(" 9. Kiểm tra co-sign qualified");
    console.log("10. Xem tiến trình co-sign");
    console.log("11. Xem Nonce operator");
    console.log("12. Xem Co-Sign Policy");
    console.log("13. Xem cấu hình Co-Sign Operator");
    console.log("14. Xem config Runtime Tenant");
    console.log("15. Xem mức phạt vi phạm");
    console.log("16. Xem thông tin lịch sử giao dịch");
  }

  // ─────────────────────────────────────────────
  // HANDLERS READ-ONLY
  // ─────────────────────────────────────────────
  protected async handleGetTenantCount() {
    const count = await this.client.getTenantCount();
    console.log(`📊 Số lượng tenant: ${count}`);
  }

  protected async handleListTenants() {
    const page = await this.rl.question("🔹 Offset (mặc định 0): ");
    const limit = await this.rl.question("🔹 Limit (mặc định 10): ");
    const tenants = await this.client.listTenants(
      Number(page) || 0,
      Number(limit) || 10,
    );
    if (tenants.length === 0) {
      console.log("  (Không có tenant nào)");
      return;
    }
    console.log(`\n📋 Danh sách Tenant (${tenants.length}):`);
    tenants.forEach((t, i) => {
      sep();
      console.log(`  [${i + 1}] ID        : ${t.id}`);
      console.log(`       Admin     : ${t.admin}`);
      console.log(`       Op.Manager: ${t.operatorManager}`);
      console.log(`       Treasury  : ${t.treasury}`);
      console.log(`       Trạng thái: ${fmtBool(t.isActive)}`);
      console.log(`       Tạo lúc   : ${fmtDate(t.createdAt)}`);
    });
    sep();
  }

  protected async handleGetTenantInfo() {
    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const info = await this.client.getTenantInfo(tenantId);
    if (!info) {
      console.log("  ❌ Tenant không tồn tại.");
      return;
    }
    console.log("\n📄 Thông tin Tenant:");
    sep();
    console.log(`  ID        : ${info.id}`);
    console.log(`  Admin     : ${info.admin}`);
    console.log(`  Op.Manager: ${info.operatorManager}`);
    console.log(`  Treasury  : ${info.treasury}`);
    console.log(`  Trạng thái: ${fmtBool(info.isActive)}`);
    console.log(`  Tạo lúc   : ${fmtDate(info.createdAt)}`);
    sep();
  }

  protected async handleGetOperatorCount() {
    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const count = await this.client.getOperatorCount(tenantId);
    console.log(`📊 Số lượng operator: ${count}`);
  }

  protected async handleListOperators() {
    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const page = await this.rl.question("🔹 Offset (mặc định 0): ");
    const limit = await this.rl.question("🔹 Limit (mặc định 10): ");
    const operators = await this.client.listOperators(
      tenantId,
      Number(page) || 0,
      Number(limit) || 10,
    );
    if (operators.length === 0) {
      console.log("  (Không có operator nào)");
      return;
    }
    console.log(`\n📋 Danh sách Operator (${operators.length}):`);
    operators.forEach((op, i) => {
      sep();
      console.log(`  [${i + 1}] Địa chỉ      : ${op.walletAddress}`);
      console.log(`       Trạng thái   : ${fmtBool(op.isActive)}`);
      console.log(`       Stake         : ${op.stakeAmount}`);
      console.log(`       Nonce         : ${op.nonce}`);
      console.log(
        `       Unstake lúc   : ${op.unstakeReadyAt ? fmtDate(op.unstakeReadyAt) : "—"}`,
      );
      console.log(`       Có thể unstake: ${fmtBool(op.canUnstakeNow)}`);
      console.log(
        `       Recovery      : ${op.recoveryDelegate !== ZERO_ADDR ? op.recoveryDelegate : "—"}`,
      );
      if (op.metadataURI)
        console.log(`       MetadataURI   : ${op.metadataURI}`);
    });
    sep();
  }

  protected async handleGetOperatorStatus() {
    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const operator = await this.rl.question("🔹 Nhập địa chỉ Operator: ");
    const op = await this.client.getOperatorStatus(tenantId, operator);
    console.log("\n📄 Trạng thái Operator:");
    sep();
    console.log(`  Địa chỉ        : ${op.walletAddress}`);
    console.log(`  Tồn tại        : ${fmtBool(op.exists)}`);
    console.log(`  Đang hoạt động : ${fmtBool(op.isActive)}`);
    console.log(`  Stake           : ${op.stakeAmount}`);
    console.log(`  Nonce           : ${op.nonce}`);
    console.log(
      `  Unstake sẵn lúc : ${op.unstakeReadyAt ? fmtDate(op.unstakeReadyAt) : "—"}`,
    );
    console.log(`  Có thể unstake  : ${fmtBool(op.canUnstakeNow)}`);
    console.log(
      `  Recovery delegate: ${op.recoveryDelegate !== ZERO_ADDR ? op.recoveryDelegate : "—"}`,
    );
    if (op.metadataURI) console.log(`  MetadataURI     : ${op.metadataURI}`);
    sep();
  }

  protected async handleGetDocumentStatus() {
    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const fileHash = await this.rl.question("🔹 Nhập File Hash (bytes32): ");
    const doc = await this.client.getDocumentStatus(tenantId, fileHash);
    if (!doc.exists) {
      console.log("  ❌ Tài liệu không tồn tại.");
      return;
    }
    console.log("\n📄 Trạng thái Tài liệu:");
    sep();
    console.log(`  Hợp lệ             : ${fmtBool(doc.isValid)}`);
    console.log(`  Người đăng ký      : ${doc.issuer}`);
    console.log(`  CID                : ${doc.cid}`);
    console.log(`  Thời gian          : ${fmtDate(doc.timestamp)}`);
    console.log(`  Loại tài liệu      : ${doc.docType}`);
    console.log(`  Phiên bản          : ${doc.version}`);
    console.log(`  Co-sign count      : ${doc.coSignCount}`);
    console.log(`  Trusted co-sign    : ${doc.trustedCoSignCount}`);
    console.log(`  Co-sign qualified  : ${fmtBool(doc.coSignQualified)}`);
    sep();
  }

  protected async handleVerify() {
    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const fileHash = await this.rl.question("🔹 Nhập File Hash (bytes32): ");
    const r = await this.client.verify(tenantId, fileHash);
    const res = r as any;
    console.log("\n🔍 Kết quả xác thực:");
    sep();
    console.log(`  Tồn tại  : ${fmtBool(res.exists ?? false)}`);
    console.log(`  Hợp lệ   : ${fmtBool(res.isValid ?? false)}`);
    console.log(`  Người ký : ${res.issuer ?? "—"}`);
    console.log(`  CID      : ${res.cid ?? "—"}`);
    sep();
  }

  protected async handleIsDocumentCoSignQualified() {
    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const fileHash = await this.rl.question("🔹 Nhập File Hash (bytes32): ");
    const qualified = await this.client.isDocumentCoSignQualified(
      tenantId,
      fileHash,
    );
    console.log(`\n  Co-sign qualified: ${fmtBool(qualified)}`);
  }

  protected async handleGetCoSignStatus() {
    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const fileHash = await this.rl.question("🔹 Nhập File Hash (bytes32): ");
    const s = await this.client.getCoSignStatus(tenantId, fileHash);
    console.log("\n📊 Trạng thái Co-Sign:");
    sep();
    console.log(`  Qualified          : ${fmtBool(s.coSignQualified)}`);
    console.log(`  Tổng co-signer     : ${s.coSignCount}`);
    console.log(`  Trusted co-signer  : ${s.trustedCoSignCount}`);
    console.log(`  Current role mask  : ${s.trustedCoSignRoleMask}`);
    console.log(`  Required role mask : ${s.requiredRoleMask}`);
    console.log(`  Min signers        : ${s.minSigners}`);
    console.log(`  Min stake          : ${s.minStake}`);
    sep();
  }

  protected async handleGetNonce() {
    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const operator = await this.rl.question("🔹 Nhập địa chỉ Operator: ");
    const nonce = await this.client.getNonceCount(tenantId, operator);
    console.log(`\n  Nonce hiện tại: ${nonce}`);
  }

  protected async handleGetCoSignPolicy() {
    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const docType = await this.rl.question("🔹 Nhập Doc Type (số): ");
    const p = await this.client.getCoSignPolicy(tenantId, Number(docType));
    console.log("\n📋 Co-Sign Policy:");
    sep();
    console.log(`  Bật               : ${fmtBool(p.enabled)}`);
    console.log(`  Min stake         : ${p.minStake}`);
    console.log(`  Min signers       : ${p.minSigners}`);
    console.log(`  Required role mask: ${p.requiredRoleMask}`);
    sep();
  }

  protected async handleGetCoSignOperatorConfig() {
    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const docType = await this.rl.question("🔹 Nhập Doc Type (số): ");
    const operator = await this.rl.question("🔹 Nhập địa chỉ Operator: ");
    const c = await this.client.getCoSignOperatorConfig(
      tenantId,
      Number(docType),
      operator,
    );
    console.log("\n📋 Cấu hình Co-Sign Operator:");
    sep();
    console.log(`  Địa chỉ    : ${operator}`);
    console.log(`  Whitelisted: ${fmtBool(c.whitelisted)}`);
    console.log(`  Role ID    : ${c.roleId}`);
    sep();
  }

  protected async handleGetTenantRuntimeConfig() {
    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const c = await this.client.getTenantRuntimeConfig(tenantId);
    console.log("\n⚙️  Runtime Config Tenant:");
    sep();
    console.log(`  Min operator stake: ${c.minOperatorStake}`);
    console.log(`  Unstake cooldown  : ${fmtSecs(c.unstakeCooldown)}`);
    sep();
  }

  protected async handleGetViolationPenalty() {
    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const violationCode = await this.rl.question(
      "🔹 Nhập Violation Code (string): ",
    );
    const penalty = await this.client.getViolationPenalty(
      tenantId,
      violationCode,
    );
    const pct = (penalty / 100).toFixed(2);
    console.log(`\n  Penalty: ${penalty} BPS (${pct}%)`);
  }

  protected async handleGetTransactionByHash() {
    const txHash = await this.rl.question(
      "🔹 Nhập Transaction Hash (bytes32): ",
    );
    const history = await this.client.getTransactionByHash(txHash);
    console.log(history);
  }

  // ─────────────────────────────────────────────
  // COMMON CHOICE HANDLER (1–15)
  // Trả về true nếu đã xử lý, false nếu không khớp
  // ─────────────────────────────────────────────
  protected async handleCommonChoice(choice: number): Promise<boolean> {
    try {
      switch (choice) {
        case 1:
          await this.handleGetTenantCount();
          return true;
        case 2:
          await this.handleListTenants();
          return true;
        case 3:
          await this.handleGetTenantInfo();
          return true;
        case 4:
          await this.handleGetOperatorCount();
          return true;
        case 5:
          await this.handleListOperators();
          return true;
        case 6:
          await this.handleGetOperatorStatus();
          return true;
        case 7:
          await this.handleGetDocumentStatus();
          return true;
        case 8:
          await this.handleVerify();
          return true;
        case 9:
          await this.handleIsDocumentCoSignQualified();
          return true;
        case 10:
          await this.handleGetCoSignStatus();
          return true;
        case 11:
          await this.handleGetNonce();
          return true;
        case 12:
          await this.handleGetCoSignPolicy();
          return true;
        case 13:
          await this.handleGetCoSignOperatorConfig();
          return true;
        case 14:
          await this.handleGetTenantRuntimeConfig();
          return true;
        case 15:
          await this.handleGetViolationPenalty();
          return true;
        case 16:
          await this.handleGetTransactionByHash();
          return true;
        default:
          return false;
      }
    } catch (error: any) {
      console.error("❌ Lỗi:", error.message ?? error);
      return true;
    }
  }

  // ─────────────────────────────────────────────
  // ABSTRACT — mỗi role tự implement
  // ─────────────────────────────────────────────
  protected abstract printRoleMenu(): void;
  protected abstract handleRoleChoice(choice: number): Promise<boolean>; // false = thoát

  // ─────────────────────────────────────────────
  // MAIN LOOP
  // ─────────────────────────────────────────────
  async run(): Promise<void> {
    console.log("\n✅ Hệ thống sẵn sàng!");
    const count = await this.client.getTenantCount();
    console.log(`📊 Số lượng tenant hiện tại: ${count}`);

    let running = true;
    while (running) {
      console.log("\n" + "─".repeat(40));
      this.printCommonMenu();
      this.printRoleMenu();
      console.log("0. Thoát");
      console.log("─".repeat(40));

      const choose = await this.rl.question("Chọn: ");
      const n = Number(choose);

      if (n === 0) {
        console.log("Chào tạm biệt!");
        running = false;
      } else {
        const handled = await this.handleCommonChoice(n);
        if (!handled) {
          running = await this.handleRoleChoice(n);
        }
      }
    }

    this.rl.close();
  }
}
