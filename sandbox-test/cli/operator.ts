/**
 * OperatorCLI — Quyền OPERATOR (có stake trong tenant)
 * Hàm đặc quyền:
 *   joinAsOperator, topUpStake, updateOperatorMetadata,
 *   requestUnstake, executeUnstake,
 *   registerWithSignature, coSignDocumentWithSignature,
 *   setRecoveryDelegate, recoverOperatorByDelegate
 */
import { BlockchainClient, createRegisterPayload } from "@verzik/sdk";
import { BaseTestCLI } from "./base";

export class OperatorCLI extends BaseTestCLI {
  constructor(client: BlockchainClient) {
    super(client);
  }

  protected printRoleMenu(): void {
    console.log("\n=== OPERATOR ===");
    console.log("20. Gia nhập làm Operator (joinAsOperator)");
    console.log("21. Nạp thêm Stake (topUpStake)");
    console.log("22. Cập nhật Metadata Operator");
    console.log("23. Yêu cầu rút Stake (requestUnstake)");
    console.log("24. Thực thi rút Stake (executeUnstake)");
    console.log("25. Ký tài liệu (registerWithSignature)");
    console.log("26. Đồng ký tài liệu (coSignDocumentWithSignature)");
    console.log("27. Thiết lập Recovery Delegate");
    console.log("28. Khôi phục Operator (bằng Delegate)");
  }

  protected async handleRoleChoice(choice: number): Promise<boolean> {
    try {
      switch (choice) {
        case 20:
          await this.handleJoinAsOperator();
          break;
        case 21:
          await this.handleTopUpStake();
          break;
        case 22:
          await this.handleUpdateOperatorMetadata();
          break;
        case 23:
          await this.handleRequestUnstake();
          break;
        case 24:
          await this.handleExecuteUnstake();
          break;
        case 25:
          await this.handleRegisterWithSignature();
          break;
        case 26:
          await this.handleCoSignDocumentWithSignature();
          break;
        case 27:
          await this.handleSetRecoveryDelegate();
          break;
        case 28:
          await this.handleRecoverOperatorByDelegate();
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
  // HANDLERS OPERATOR
  // ─────────────────────────────────────────────

  private async handleJoinAsOperator() {
    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const metadata = await this.rl.question("🔹 Metadata URI: ");
    const ethAmount = await this.rl.question("🔹 Số ETH stake (ví dụ 0.1): ");

    const txHash = await this.client.joinAsOperator(
      tenantId,
      metadata,
      ethAmount,
    );
    console.log(`✅ Gia nhập Operator thành công! TX: ${txHash}`);
  }

  private async handleTopUpStake() {
    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const ethAmount = await this.rl.question(
      "🔹 Số ETH nạp thêm (ví dụ 0.1): ",
    );

    const txHash = await this.client.topUpStake(tenantId, ethAmount);
    console.log(`✅ Nạp thêm Stake thành công! TX: ${txHash}`);
  }

  private async handleUpdateOperatorMetadata() {
    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const metadataURI = await this.rl.question("🔹 Metadata URI mới: ");

    const txHash = await this.client.updateOperatorMetadata(
      tenantId,
      metadataURI,
    );
    console.log(`✅ Đã cập nhật Metadata! TX: ${txHash}`);
  }

  private async handleRequestUnstake() {
    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");

    const txHash = await this.client.requestUnstake(tenantId);
    console.log(`✅ Yêu cầu rút Stake đã gửi! TX: ${txHash}`);
  }

  private async handleExecuteUnstake() {
    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");

    const txHash = await this.client.executeUnstake(tenantId);
    console.log(`✅ Rút Stake thành công! TX: ${txHash}`);
  }

  private async handleRegisterWithSignature() {
    const signerAddress = await this.client.signer?.getAddress();
    if (!signerAddress) {
      console.error("❌ Không lấy được địa chỉ ví.");
      return;
    }

    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const fileHash = await this.rl.question("🔹 File Hash (bytes32): ");
    const cid = await this.rl.question("🔹 IPFS CID: ");
    const ciphertextHash = await this.rl.question(
      "🔹 Ciphertext Hash (bytes32): ",
    );
    const encryptionMetaHash = await this.rl.question(
      "🔹 Encryption Meta Hash (bytes32): ",
    );
    const docType = await this.rl.question("🔹 Doc Type (số): ");
    const version = await this.rl.question("🔹 Version (số): ");

    const currentNonce = await this.client.getNonce(tenantId, signerAddress);
    console.log(`=> Nonce hiện tại: ${currentNonce}`);

    const payload = createRegisterPayload({
      tenantId,
      fileHash,
      cid,
      ciphertextHash,
      encryptionMetaHash,
      docType: Number(docType),
      version: Number(version),
      nonce: currentNonce,
    });

    const txHash = await this.client.registerWithSignature(payload);
    console.log(`✅ Ký tài liệu thành công! TX: ${txHash}`);
  }

  private async handleCoSignDocumentWithSignature() {
    const signerAddress = await this.client.signer?.getAddress();
    if (!signerAddress) {
      console.error("❌ Không lấy được địa chỉ ví.");
      return;
    }

    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const fileHash = await this.rl.question("🔹 File Hash (bytes32): ");

    const currentNonce = await this.client.getNonce(tenantId, signerAddress);
    console.log(`=> Nonce hiện tại: ${currentNonce}`);

    // Lấy docType từ document để tạo payload
    const doc = await this.client.getDocumentStatus(tenantId, fileHash);
    if (!doc.exists) {
      console.error("❌ Tài liệu không tồn tại.");
      return;
    }

    // Dùng RegisterPayload shape nhưng chỉ cần tenantId/fileHash/nonce/deadline
    const payload = createRegisterPayload({
      tenantId,
      fileHash,
      cid: doc.cid,
      ciphertextHash: doc.ciphertextHash as unknown as string,
      encryptionMetaHash: doc.encryptionMetaHash as unknown as string,
      docType: doc.docType,
      version: doc.version,
      nonce: currentNonce,
    });

    const txHash = await this.client.coSignDocumentWithSignature(payload);
    console.log(`✅ Đồng ký tài liệu thành công! TX: ${txHash}`);
  }

  private async handleSetRecoveryDelegate() {
    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const delegate = await this.rl.question("🔹 Địa chỉ Recovery Delegate: ");

    const txHash = await this.client.setRecoveryDelegate(tenantId, delegate);
    console.log(`✅ Đã thiết lập Recovery Delegate! TX: ${txHash}`);
  }

  private async handleRecoverOperatorByDelegate() {
    const tenantId = await this.rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const lostOperator = await this.rl.question(
      "🔹 Địa chỉ Operator cũ (bị mất): ",
    );
    const reason = await this.rl.question("🔹 Lý do recovery: ");

    const txHash = await this.client.recoverOperatorByDelegate(
      tenantId,
      lostOperator,
      reason,
    );
    console.log(`✅ Recovery thành công! TX: ${txHash}`);
  }
}
