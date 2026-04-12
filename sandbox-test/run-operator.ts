import dotenv from "dotenv";
import { init } from "@verzik/sdk";
import { OperatorCLI } from "./cli/operator";

dotenv.config();

async function main() {
  try {
    const client = await init();
    const cli = new OperatorCLI(client);
    await cli.run();
  } catch (error) {
    console.error("❌ Lỗi khởi tạo:", error);
    process.exit(1);
  }
}

main();
