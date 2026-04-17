import { BlockchainQueryClient } from "../configs/blockchain.query.config";
import type { TenantCreated, OperatorJoined } from "@verzik/sdk";
import type { DocumentAnchoredResponse } from "../types/graph.type";
export class BlockchainQueryService {
  private queryClient: BlockchainQueryClient;
  constructor() {
    this.queryClient = new BlockchainQueryClient();
  }

  async getTenantCount(): Promise<number> {
    try {
      const directQuery = await this.queryClient.getDirectQuery();
      const count = await directQuery.getTenantCount();
      const data = Number(count);
      return data;
    } catch (error) {
      console.error("Service Error [getTenantCount]:", error);
      return 0;
    }
  }

  async getDocumentAnchoreds(
    first?: number,
  ): Promise<DocumentAnchoredResponse> {
    try {
      const data = await this.queryClient.getSelectedQueries(
        ["getDocumentAnchoreds"],
        first,
      );
      const result = data as Record<string, any>;
      return {
        data: result["getDocumentAnchoreds"] || [],
        total: result["getDocumentAnchoreds"].length || 0,
      };
    } catch (error) {
      console.error("Service Error [getDocumentAnchoreds]:", error);
      return {
        data: [],
        total: 0,
      };
    }
  }

  async getTenantCreateds(first?: number): Promise<TenantCreated[]> {
    try {
      const data = await this.queryClient.getSelectedQueries(
        ["getTenantCreateds"],
        first,
      );
      const result = data as Record<string, any>;
      return result["getTenantCreateds"];
    } catch (error) {
      console.error("Service Error [getTenantCreateds]:", error);
      return [];
    }
  }

  async getAllTenantInfoById(tenantId: string) {
    try {
      const query = `
        query GetFullTenantHistory($tenantId: String!) {
          tenantCreateds(where: { tenantId: $tenantId }, first: 1) {
            admin
            manager
            treasury
            blockTimestamp
            transactionHash
          }
          tenantStatusUpdateds(where: { tenantId: $tenantId }, orderBy: blockTimestamp, orderDirection: desc) {
            isActive
            blockTimestamp
            transactionHash
          }
          minOperatorStakeUpdateds(where: { tenantId: $tenantId }, orderBy: blockTimestamp, orderDirection: desc) {
            oldValue
            newValue
            blockTimestamp
            transactionHash
          }
          unstakeCooldownUpdateds(where: { tenantId: $tenantId }, orderBy: blockTimestamp, orderDirection: desc) {
            oldValue
            newValue
            blockTimestamp
            transactionHash
          }
        }
      `;

      const variables = { tenantId };
      const data = await this.queryClient.getCustomQuery(query, variables);
      return data;
    } catch (error) {
      console.error("Service Error [GetAllTenantInfoById]:", error);
      return [];
    }
  }

  async getOperatorJoineds(first?: number): Promise<DocumentAnchoredResponse> {
    try {
      const data = await this.queryClient.getSelectedQueries(
        ["getOperatorJoineds"],
        first,
      );
      const result = data as Record<string, any>;
      return {
        data: result["getOperatorJoineds"] || [],
        total: result["getOperatorJoineds"].length || 0,
      };
    } catch (error) {
      console.error("Service Error [getOperatorJoineds]:", error);
      return {
        data: [],
        total: 0,
      };
    }
  }

  async getTenantsByUsers(address: string): Promise<TenantCreated[]> {
    try {
      const data = await this.queryClient.getSelectedQueries(
        ["getTenantsByUsers"],
        address,
      );
      const result = data as Record<string, any>;
      return result["getTenantsByUsers"];
    } catch (error) {
      console.error("Service Error [getTenantsByUser]:", error);
      return [];
    }
  }

  async getOperatorByUsers(address: string): Promise<OperatorJoined[]> {
    try {
      const data = await this.queryClient.getSelectedQueries(
        ["getOperatorByUsers"],
        address,
      );
      const result = data as Record<string, any>;
      return result["getOperatorByUsers"];
    } catch (error) {
      console.error("Service Error [getOperatorByUsers]:", error);
      return [];
    }
  }
}
// async function main() {
//   const test = new BlockchainQueryService();
//   const res = await test.getOperatorJoineds();
//   console.log(res);
// }
// main();
