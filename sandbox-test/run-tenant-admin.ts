import dotenv from "dotenv";
import { init } from "@verzik/sdk";
import { TenantAdminCLI } from "./cli/tenant-admin";

dotenv.config();

async function main() {
  try {
    const client = await init();
    const cli = new TenantAdminCLI(client);
    await cli.run();
  } catch (error) {
    console.error("❌ Lỗi khởi tạo:", error);
    process.exit(1);
  }
}

main();
