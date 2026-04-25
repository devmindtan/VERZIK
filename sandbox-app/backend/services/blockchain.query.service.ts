import { BlockchainQueryClient } from "../configs/blockchain.query.config";
import type {
  TenantCreated,
  OperatorJoined,
  ViolationPenaltyUpdated,
  NonceConsumed,
  EnhancedTxResult,
  CoSignOperatorConfigured,
  CoSignPolicyUpdated,
  OperatorSlashed,
  OperatorSoftSlashed,
  OperatorUnstakeRequested,
  OperatorUnstaked,
  OperatorStatus,
  TenantInfo,
  DocumentSnapshot,
} from "@verzik/sdk";
import type { DataResponseWithTotal } from "../types/graph.type";
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

  async getNonceCount(tenantId: string, operator: string): Promise<number> {
    try {
      const directQuery = await this.queryClient.getDirectQuery();
      const count = await directQuery.getNonceCount(tenantId, operator);
      const data = Number(count);
      return data;
    } catch (error) {
      console.error("Service Error [getNonce]:", error);
      return 0;
    }
  }

  async getTransactionByHash(txHash: string): Promise<EnhancedTxResult | null> {
    try {
      const directQuery = await this.queryClient.getDirectQuery();
      const data = await directQuery.getTransactionByHash(txHash);
      const safeData = JSON.parse(
        JSON.stringify(data, (key, value) =>
          typeof value === "bigint" ? value.toString() : value,
        ),
      );
      return safeData;
    } catch (error) {
      console.error("Service Error [getTransactionByHash]:", error);
      return null;
    }
  }
  async getCoSignOperatorConfigureds(
    first?: number,
  ): Promise<CoSignOperatorConfigured[]> {
    try {
      const data = await this.queryClient.getSelectedQueries(
        ["getCoSignOperatorConfigureds"],
        first,
      );
      const result = data as Record<string, any>;
      return result["getCoSignOperatorConfigureds"];
    } catch (error) {
      console.error("Service Error [getCoSignOperatorConfigureds]:", error);
      return [];
    }
  }
  async getCoSignPolicyUpdateds(
    first?: number,
  ): Promise<CoSignPolicyUpdated[]> {
    try {
      const data = await this.queryClient.getSelectedQueries(
        ["getCoSignPolicyUpdateds"],
        first,
      );
      const result = data as Record<string, any>;
      return result["getCoSignPolicyUpdateds"];
    } catch (error) {
      console.error("Service Error [getCoSignPolicyUpdateds]:", error);
      return [];
    }
  }
  async getOperatorHardSlasheds(first?: number): Promise<OperatorSlashed[]> {
    try {
      const data = await this.queryClient.getSelectedQueries(
        ["getOperatorSlasheds"],
        first,
      );
      const result = data as Record<string, any>;
      return result["getOperatorSlasheds"];
    } catch (error) {
      console.error("Service Error [getOperatorSlasheds]:", error);
      return [];
    }
  }
  async getOperatorSoftSlashed(first?: number): Promise<OperatorSoftSlashed[]> {
    try {
      const data = await this.queryClient.getSelectedQueries(
        ["getOperatorSoftSlashed"],
        first,
      );
      const result = data as Record<string, any>;
      return result["getOperatorSoftSlashed"];
    } catch (error) {
      console.error("Service Error [getOperatorSoftSlashed]:", error);
      return [];
    }
  }
  async getOperatorUnstakeRequesteds(
    first?: number,
  ): Promise<OperatorUnstakeRequested[]> {
    try {
      const data = await this.queryClient.getSelectedQueries(
        ["getOperatorUnstakeRequesteds"],
        first,
      );
      const result = data as Record<string, any>;
      return result["getOperatorUnstakeRequesteds"];
    } catch (error) {
      console.error("Service Error [getOperatorUnstakeRequesteds]:", error);
      return [];
    }
  }
  async getOperatorUnstakeds(first?: number): Promise<OperatorUnstaked[]> {
    try {
      const data = await this.queryClient.getSelectedQueries(
        ["getOperatorUnstakeds"],
        first,
      );
      const result = data as Record<string, any>;
      return result["getOperatorUnstakeds"];
    } catch (error) {
      console.error("Service Error [getOperatorUnstakeds]:", error);
      return [];
    }
  }
  async getTenantRuntimeConfig(tenantId: string): Promise<{
    minOperatorStake: number;
    unstakeCooldown: number;
  }> {
    try {
      const directQuery = await this.queryClient.getDirectQuery();
      const data = await directQuery.getTenantRuntimeConfig(tenantId);
      return {
        minOperatorStake: Number(data.minOperatorStake),
        unstakeCooldown: Number(data.unstakeCooldown),
      };
    } catch (error) {
      console.error("Service Error [getTenantRuntimeConfig]:", error);
      return { minOperatorStake: 0, unstakeCooldown: 0 };
    }
  }
  async getDocumentStatus(
    tenantId: string,
    fileHash: string,
  ): Promise<DocumentSnapshot | null> {
    try {
      const directQuery = await this.queryClient.getDirectQuery();
      const data = await directQuery.getDocumentStatus(tenantId, fileHash);
      return data;
    } catch (error) {
      console.error("Service Error [getDocumentStatus]:", error);
      return null;
    }
  }
  async getOperatorStatus(
    tenantId: string,
    operator: string,
  ): Promise<OperatorStatus | null> {
    try {
      const directQuery = await this.queryClient.getDirectQuery();
      const data = await directQuery.getOperatorStatus(tenantId, operator);
      return data;
    } catch (error) {
      console.error("Service Error [getOperatorStatus]:", error);
      return null;
    }
  }
  async getTenantInfo(tenantId: string): Promise<TenantInfo | null> {
    try {
      const directQuery = await this.queryClient.getDirectQuery();
      const data = await directQuery.getTenantInfo(tenantId);
      return data;
    } catch (error) {
      console.error("Service Error [getTenantInfo]:", error);
      return null;
    }
  }

  async getNonceConsumeds(first?: number): Promise<NonceConsumed[]> {
    try {
      const data = await this.queryClient.getSelectedQueries(
        ["getNonceConsumeds"],
        first,
      );
      const result = data as Record<string, any>;
      return result["getNonceConsumeds"];
    } catch (error) {
      console.error("Service Error [getNonceConsumeds]:", error);
      return [];
    }
  }

  async getAllNonceConsumedInfoById(tenantId: string, signer: string) {
    try {
      const query = `
        query GetAllNonceConsumedInfoById($tenantId: String!, $signer: String!) {
          nonceConsumeds(
            where: { 
              tenantId: $tenantId, 
              signer: $signer 
            }, 
            orderBy: blockTimestamp, 
            orderDirection: desc
          ) {
            blockNumber
            blockTimestamp
            id
            newNonce
            oldNonce
            signer
            tenantId
            transactionHash
          }
}
      `;

      const variables = { tenantId, signer };
      const data = await this.queryClient.getCustomQuery(query, variables);
      return data;
    } catch (error) {
      console.error("Service Error [GetAllNonceConsumedInfoById]:", error);
      return [];
    }
  }

  async getDocumentAnchoreds(first?: number): Promise<DataResponseWithTotal> {
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
        query GetAllTenantInfoById($tenantId: String!) {
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

  async getAllDocumentInfoById(tenantId: string, fileHash: string) {
    try {
      const query = `
        query GetAllDocumentInfoById($tenantId: String!, $fileHash: String!) {
          documentAnchoreds(where: {tenantId: $tenantId, fileHash: $fileHash}, first: 1) {
            blockNumber
            cid
            blockTimestamp
            ciphertextHash
            docType
            encryptionMetaHash
            fileHash
            id
            issuer
            transactionHash
            owner
            tenantId
            version
          }
          documentCoSignQualifieds(where: { tenantId: $tenantId, fileHash: $fileHash}, orderBy: blockTimestamp, orderDirection: desc) {
            blockNumber
            blockTimestamp
            fileHash
            id
            roleMask
            tenantId
            transactionHash
            trustedSigners
          }
          documentCoSigneds(where: { tenantId: $tenantId, fileHash: $fileHash}, orderBy: blockTimestamp, orderDirection: desc) {
            blockNumber
            blockTimestamp
            fileHash
            id
            signer
            tenantId
            totalSigners
            transactionHash
          }
          documentRevokeds(where: { tenantId: $tenantId, fileHash: $fileHash}, orderBy: blockTimestamp, orderDirection: desc) {
            blockTimestamp
            blockNumber
            id
            fileHash
            reason
            tenantId
            transactionHash
            revoker
          }
        }
      `;
      const variables = {
        tenantId: tenantId.toLowerCase(),
        fileHash: fileHash.toLowerCase(),
      };
      const data = await this.queryClient.getCustomQuery(query, variables);
      return data;
    } catch (error) {
      console.error("Service Error [GetAllDocumentInfoById]:", error);
      return [];
    }
  }

  async getAllOperatorInfoById(tenantId: string, operator: string) {
    try {
      const query = `
        query GetAllOperatorInfoById($tenantId: String!, $operator: String!) {
          operatorJoineds(where: { tenantId: $tenantId, operator: $operator}, first: 1) {
            blockNumber
            blockTimestamp
            id
            metadata
            stake
            tenantId
            transactionHash
            operator
          }
          operatorStatusUpdateds(where: { tenantId: $tenantId, operator: $operator}, orderBy: blockTimestamp, orderDirection: desc) {
            blockNumber
            blockTimestamp
            id
            isActive
            tenantId
            transactionHash
            operator
            reason
          }
          coSignOperatorConfigureds(where: { tenantId: $tenantId, operator: $operator}, orderBy: blockTimestamp, orderDirection: desc) {
            blockNumber
            blockTimestamp
            docType
            id
            operator
            roleId
            tenantId
            transactionHash
            whitelisted
          }
          operatorStakeToppedUps(where: { tenantId: $tenantId, operator: $operator}, orderBy: blockTimestamp, orderDirection: desc) {
            amount
            blockNumber
            blockTimestamp
            id
            operator
            tenantId
            totalStake
            transactionHash
          }
          operatorSlasheds (where: { tenantId: $tenantId, operator: $operator}, orderBy: blockTimestamp, orderDirection: desc){
            amount
            blockNumber
            blockTimestamp
            id
            operator
            reason
            slasher
            tenantId
            transactionHash
          }
          operatorSoftSlasheds(where: { tenantId: $tenantId, operator: $operator}, orderBy: blockTimestamp, orderDirection: desc) {
            blockNumber
            blockTimestamp
            id
            operator
            penaltyBps
            reason
            remainingStake
            slashedAmount
            slasher
            tenantId
            transactionHash
            violationCode
          }
        }
      `;
      const variables = {
        tenantId: tenantId.toLowerCase(),
        operator: operator.toLowerCase(),
      };
      const data = await this.queryClient.getCustomQuery(query, variables);
      return data;
    } catch (error) {
      console.error("Service Error [GetAllOperatorInfoById]:", error);
      return [];
    }
  }
  async getOperatorJoineds(first?: number): Promise<DataResponseWithTotal> {
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
  async getViolationPenaltyUpdateds(
    first?: number,
  ): Promise<ViolationPenaltyUpdated[]> {
    try {
      const data = await this.queryClient.getSelectedQueries(
        ["getViolationPenaltyUpdateds"],
        first,
      );
      const result = data as Record<string, any>;
      return result["getViolationPenaltyUpdateds"];
    } catch (error) {
      console.error("Service Error [getViolationPenaltyUpdateds]:", error);
      return [];
    }
  }
  async getPenaltyById(tenantId: string): Promise<ViolationPenaltyUpdated[]> {
    try {
      const query = `
        query GetPenaltyById($tenantId: String!) {
          violationPenaltyUpdateds(where: {tenantId: $tenantId}, first: 1) {
            blockNumber
            id
            newPenaltyBps
            blockTimestamp
            tenantId
            oldPenaltyBps
            transactionHash
            violationCode
          }
        }
      `;
      const variables = {
        tenantId: tenantId.toLowerCase(),
      };
      const data = (await this.queryClient.getCustomQuery(
        query,
        variables,
      )) as ViolationPenaltyUpdated[];
      return data;
    } catch (error) {
      console.error("Service Error [GetPenaltyById]:", error);
      return [];
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

  async getDocumentCoSignQualifieds(
    first?: number,
  ): Promise<DataResponseWithTotal> {
    try {
      const data = await this.queryClient.getSelectedQueries(
        ["getDocumentCoSignQualifieds"],
        first,
      );
      const result = data as Record<string, any>;
      return {
        data: result["getDocumentCoSignQualifieds"] || [],
        total: result["getDocumentCoSignQualifieds"].length || 0,
      };
    } catch (error) {
      console.error("Service Error [getDocumentCoSignQualifieds]:", error);
      return {
        data: [],
        total: 0,
      };
    }
  }
}
// async function main() {
//   const test = new BlockchainQueryService();
//   const res = await test.getOperatorJoineds();
//   console.log(res);
// }
// main();
