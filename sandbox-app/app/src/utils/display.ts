// import dotenv from "dotenv";

// dotenv.config();
export function shortValue(
  value: string | undefined | null,
  head = 8,
  tail = 6,
): string {
  if (!value) return "-";
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}
// Hiển thị 8 ký tự đầu và 6 ký tự cuối (Mặc định thường là 0x1234...abcd)
export function shortAddress(value: string | undefined | null): string {
  return shortValue(value, 6, 4);
}

export function shortBytes32(value: string | undefined | null): string {
  return shortValue(value, 10, 8);
}
export function getRpcConfig(privateKey?: string) {
  // Kiểm tra Vite (browser) hoặc Node.js (process.env)
  const rpcUrl = (import.meta.env?.VITE_RPC_URL || process.env.VITE_RPC_URL) as
    | string
    | undefined;
  const protocolAddress = (import.meta.env?.VITE_PROTOCOL_ADDRESS ||
    process.env.VITE_PROTOCOL_ADDRESS) as string | undefined;
  const readerAddress = (import.meta.env?.VITE_READER_ADDRESS ||
    process.env.VITE_READER_ADDRESS) as string | undefined;

  if (!rpcUrl || !protocolAddress) {
    // Log thêm để debug xem nó đang tìm ở đâu
    console.error("DEBUG ENV:", {
      vite: import.meta.env,
      node: process.env.VITE_RPC_URL,
    });
    throw new Error("Thiếu cấu hình RPC/Protocol address...");
  }

  return { rpcUrl, protocolAddress, readerAddress, privateKey };
}
