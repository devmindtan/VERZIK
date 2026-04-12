import dotenv from "dotenv";
import { init } from "@verzik/sdk";
import { TenantManagerCLI } from "./cli/tenant-manager";

dotenv.config();

async function main() {
  try {
    const client = await init();
    const cli = new TenantManagerCLI(client);
    await cli.run();
  } catch (error) {
    console.error("❌ Lỗi khởi tạo:", error);
    process.exit(1);
  }
}

main();
