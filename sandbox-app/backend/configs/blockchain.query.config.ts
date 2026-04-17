import {
  GraphQueryClient,
  createGraphQueryClient,
  DirectQueryClient,
  createDirectQueryClient,
} from "@verzik/sdk";
import dotenv from "dotenv";
dotenv.config();
type ClientMethod = (...args: unknown[]) => Promise<unknown>;

export class BlockchainQueryClient {
  protected graphQuery: GraphQueryClient;
  protected directQuery: DirectQueryClient;

  constructor() {
    this.graphQuery = createGraphQueryClient({
      endpoint: process.env.GRAPH_NODE_URL || "",
    });
    this.directQuery = createDirectQueryClient({
      rpcUrl: process.env.RPC_URL || "",
      protocolAddress: process.env.PROTOCOL_ADDRESS || "",
      readerAddress: process.env.READER_ADDRESS || "",
    });
  }
  private getClientMethodNames(): string[] {
    return Object.getOwnPropertyNames(Object.getPrototypeOf(this.graphQuery))
      .filter((name) => name !== "constructor" && name.startsWith("get"))
      .sort((left, right) => left.localeCompare(right));
  }

  async getDirectQuery() {
    return this.directQuery;
  }
  /**
   * Chạy các hàm query dựa trên danh sách tên truyền vào
   * @param getSelectedQueries Mảng tên hàm (ví dụ: ['getTenantCreateds', 'getDocumentAnchoreds'])
   */
  async getSelectedQueries(
    methodsToRun: string[],
    param?: number | string,
  ): Promise<Record<string, unknown>> {
    const results: Record<string, unknown> = {};
    const availableMethods = this.getClientMethodNames();
    // console.log(availableMethods);
    const targetMethods =
      methodsToRun.length > 0
        ? methodsToRun.filter((name) => availableMethods.includes(name))
        : availableMethods;

    await Promise.all(
      targetMethods.map(async (methodName) => {
        const clientRecord = this.graphQuery as unknown as Record<
          string,
          ClientMethod
        >;
        const method = clientRecord[methodName];
        const isListQuery = methodName.endsWith("s");

        try {
          if (typeof method !== "function") {
            results[methodName] = isListQuery ? [] : null;
            return;
          }

          if (isListQuery) {
            results[methodName] = await method.apply(this.graphQuery, [param]);
          }
        } catch (error) {
          console.error(`Lỗi khi lấy dữ liệu từ ${methodName}:`, error);
          results[methodName] = [];
        }
      }),
    );

    return results;
  }
}
// async function main() {
//   const test = new BlockchainGraphQueryClient();
//   const result = await test.getSelectedQueries(
//     ["getTenantsByUsers"],
//     "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
//   );
//   console.log(result);
// }
// main();
