import dotenv from "dotenv";
import { init } from "@verzik/sdk";
dotenv.config();

async function startApp() {
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
async function main() {
  await startApp();
}
main();
