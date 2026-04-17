import {
  BlockchainSetClient as SetClient,
  createBlockchainSetClient,
} from "@verzik/sdk";
import dotenv from "dotenv";
dotenv.config();

export class BlockchainSetClient {
  protected setClient: SetClient;

  constructor() {
    this.setClient = createBlockchainSetClient({
      rpcUrl: process.env.RPC_URL || "",
      protocolAddress: process.env.PROTOCOL_ADDRESS || "",
      readerAddress: process.env.READER_ADDRESS || "",
    });
  }
  async getSetClient() {
    return this.setClient;
  }
}
