import dotenv from "dotenv";
import { init, BlockchainClient, createRegisterPayload } from "@verzik/sdk";

import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

dotenv.config();
const rl = readline.createInterface({ input, output });

async function startApp(): Promise<BlockchainClient | null> {
  try {
    const client = await init();
    console.log("✅ Hệ thống đã sẵn sàng!");

    const count = await client.getTenantCount();
    console.log(`📊 Số lượng tenant hiện tại: ${count}`);
    return client;
  } catch (error) {
    console.error("❌ Lỗi khởi tạo SDK:", error);
    return null;
  }
}
async function generateMenu() {
  console.log("\n--- MENU HỆ THỐNG ---");
  console.log("0. Thoát");
  console.log("1. Xem danh sách Tenant");
  console.log("2. Đăng ký Operator (Join)");
  console.log("3. Ký tài liệu (Register)");
  console.log("---------------------");
}

async function handleJoinAsOperator(client: BlockchainClient) {
  try {
    const tenantId = await rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const metadata = await rl.question("🔹 Nhập Metadata URI: ");
    const ethAmount = await rl.question(
      "🔹 Nhập số ETH muốn stake (ví dụ 0.1): ",
    );

    console.log("⏳ Đang gửi giao dịch lên mạng...");

    const txHash = await client.joinAsOperator(tenantId, metadata, ethAmount);

    console.log(`🚀 Thêm thành công! Hash: ${txHash}`);
  } catch (error: any) {
    console.error("❌ Lỗi khi Join Operator:", error.message);
  }
}

async function handleRegisterWithSignature(client: BlockchainClient) {
  try {
    const signerAddress = await client.signer?.getAddress();
    if (!signerAddress) {
      console.error("Lỗi khi lấy địa chỉ ví");
      return;
    }
    const tenantId = await rl.question("🔹 Nhập Tenant ID (bytes32): ");
    const currentNonce = await client.getNonce(tenantId, signerAddress);
    console.log("=> Nonce hiện tại của " + signerAddress + ": " + currentNonce);
    const myPayload = createRegisterPayload({
      tenantId: tenantId,
      fileHash:
        "0x7d5a9d2d0b5d9d2d0b5d9d2d0b5d9d2d0b5d9d2d0b5d9d2d0b5d9d2d0b5d9d2d",
      cid: "QmZVk9aTa6FEx5T6troBdsJfVot2wwnuQs9cHtQH4mauwi",
      ciphertextHash:
        "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
      encryptionMetaHash:
        "0xfeef8899aabbccddeeff00112233445566778899aabbccddeeff001122334455",
      docType: 1,
      version: 1,
      nonce: currentNonce,
    });

    const txHash = await client.registerWithSignature(myPayload);

    console.log(`🚀 Thêm thành công! Hash: ${txHash}`);
  } catch (error: any) {
    console.error("❌ Lỗi khi Register file: ", error.message);
  }
}

async function main() {
  const client = await startApp();
  if (!client) return rl.close();

  try {
    let flag = true;

    while (flag) {
      await generateMenu();
      let choose = await rl.question("Chọn: ");
      switch (Number(choose)) {
        case 0:
          flag = false;
          console.log("Chào tạm biệt");
          break;
        case 1:
          const list = await client.listTenants();
          console.table(list);
          break;
        case 2:
          await handleJoinAsOperator(client);
          break;
        case 3:
          await handleRegisterWithSignature(client);
          break;
        default:
          console.log("Nhập sai nhập lại~~");
          break;
      }
    }
  } finally {
    rl.close();
  }
}
main();
