import { BlockchainSetClient } from "../configs/blockchain.set.config";
import { TenantConfig } from "@verzik/sdk";
export class BlockchainSetService {
  private setClient: BlockchainSetClient;

  constructor() {
    this.setClient = new BlockchainSetClient();
  }

  async createTenant(
    tenantName: string,
    treasuryAddress: string,
    config: TenantConfig,
  ): Promise<string> {
    try {
      const setObj = await this.setClient.getSetClient();
      const txHash = setObj.createTenant(tenantName, treasuryAddress, config);

      return txHash;
    } catch (error) {
      console.error("Service Error [getTenantCount]:", error);
      return "";
    }
  }
}
