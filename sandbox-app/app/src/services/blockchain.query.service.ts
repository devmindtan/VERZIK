const RAW_BASE = import.meta.env.VITE_BACKEND_URL as string | undefined;
const BASE = (RAW_BASE ?? "").replace(/\/$/, "");

export interface FullDataResponse {
  success: boolean;
  data: DataResponseWithTotal;
}
export interface DataResponseWithTotal {
  data: Array<Record<string, unknown>>;
  total: number;
}

export interface DataResponse {
  success: boolean;
  data: Array<Record<string, unknown>>;
}

export interface ScalarDataResponse<T> {
  success: boolean;
  data: T;
}

function buildQuery(
  params: Record<string, string | number | undefined>,
): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && `${value}`.trim() !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchDocumentAnchoreds(
  first?: number,
): Promise<FullDataResponse | null> {
  const query = buildQuery({ first });
  return getJson<FullDataResponse>(`/api/documents${query}`);
}
export async function fetchTenantCount(): Promise<DataResponse | null> {
  return getJson<DataResponse>("/api/tenant-count");
}
export async function fetchOperatorJoineds(
  first?: number,
): Promise<FullDataResponse | null> {
  const query = buildQuery({ first });
  return getJson<FullDataResponse>(`/api/operators${query}`);
}
export async function fetchTenantCreateds(
  first?: number,
): Promise<DataResponse | null> {
  const query = buildQuery({ first });
  return getJson<DataResponse>(`/api/tenants${query}`);
}
export async function fetchDocumentCoSignQualifieds(
  first?: number,
): Promise<FullDataResponse | null> {
  const query = buildQuery({ first });
  return getJson<FullDataResponse>(`/api/document-qualifieds${query}`);
}

export async function fetchTransactionByHash(
  txHash: string,
): Promise<ScalarDataResponse<Record<string, unknown>> | null> {
  const query = buildQuery({ txHash });
  return getJson<ScalarDataResponse<Record<string, unknown>>>(
    `/api/transaction${query}`,
  );
}

export async function fetchNonceCountByTenantAndOperator(
  tenantId: string,
  operator: string,
): Promise<ScalarDataResponse<number> | null> {
  const query = buildQuery({ tenantId, operator });
  return getJson<ScalarDataResponse<number>>(`/api/nonce-count${query}`);
}

export async function fetchNonceInfoByTenantAndSigner(
  tenantId: string,
  signer: string,
): Promise<ScalarDataResponse<Record<string, unknown>> | null> {
  const query = buildQuery({ tenantId, signer });
  return getJson<ScalarDataResponse<Record<string, unknown>>>(
    `/api/nonce${query}`,
  );
}

export async function fetchNonceConsumeds(
  first?: number,
): Promise<DataResponse | null> {
  const query = buildQuery({ first });
  return getJson<DataResponse>(`/api/nonces${query}`);
}

export async function fetchTenantInfoById(
  tenantId: string,
): Promise<ScalarDataResponse<Record<string, unknown>> | null> {
  const query = buildQuery({ tenantId });
  return getJson<ScalarDataResponse<Record<string, unknown>>>(
    `/api/tenant${query}`,
  );
}

export async function fetchOperatorInfoById(
  tenantId: string,
  operator: string,
): Promise<ScalarDataResponse<Record<string, unknown>> | null> {
  const query = buildQuery({ tenantId, operator });
  return getJson<ScalarDataResponse<Record<string, unknown>>>(
    `/api/operator${query}`,
  );
}

export async function fetchDocumentInfoById(
  tenantId: string,
  fileHash: string,
): Promise<ScalarDataResponse<Record<string, unknown>> | null> {
  const query = buildQuery({ tenantId, fileHash });
  return getJson<ScalarDataResponse<Record<string, unknown>>>(
    `/api/document${query}`,
  );
}

export async function fetchPenaltyByTenantId(
  tenantId: string,
): Promise<ScalarDataResponse<Record<string, unknown>> | null> {
  const query = buildQuery({ tenantId });
  return getJson<ScalarDataResponse<Record<string, unknown>>>(
    `/api/penalty${query}`,
  );
}

export async function fetchViolationPenaltyUpdateds(
  first?: number,
): Promise<ScalarDataResponse<Array<Record<string, unknown>>> | null> {
  const query = buildQuery({ first });
  return getJson<ScalarDataResponse<Array<Record<string, unknown>>>>(
    `/api/penalties${query}`,
  );
}
export async function fetchCoSignOperatorConfigureds(
  first?: number,
): Promise<ScalarDataResponse<Array<Record<string, unknown>>> | null> {
  const query = buildQuery({ first });
  return getJson<ScalarDataResponse<Array<Record<string, unknown>>>>(
    `/api/cosign-operators${query}`,
  );
}
export async function fetchCoSignPolicyUpdateds(
  first?: number,
): Promise<ScalarDataResponse<Array<Record<string, unknown>>> | null> {
  const query = buildQuery({ first });
  return getJson<ScalarDataResponse<Array<Record<string, unknown>>>>(
    `/api/cosign-policies${query}`,
  );
}
export async function fetchOperatorHardSlasheds(
  first?: number,
): Promise<ScalarDataResponse<Array<Record<string, unknown>>> | null> {
  const query = buildQuery({ first });
  return getJson<ScalarDataResponse<Array<Record<string, unknown>>>>(
    `/api/operator-hard-slasheds${query}`,
  );
}
export async function fetchOperatorSoftSlasheds(
  first?: number,
): Promise<ScalarDataResponse<Array<Record<string, unknown>>> | null> {
  const query = buildQuery({ first });
  return getJson<ScalarDataResponse<Array<Record<string, unknown>>>>(
    `/api/operator-soft-slasheds${query}`,
  );
}

export async function fetchOperatorUnstakeRequesteds(
  first?: number,
): Promise<ScalarDataResponse<Array<Record<string, unknown>>> | null> {
  const query = buildQuery({ first });
  return getJson<ScalarDataResponse<Array<Record<string, unknown>>>>(
    `/api/operator-unstake-requesteds${query}`,
  );
}

export async function fetchOperatorUnstakeds(
  first?: number,
): Promise<ScalarDataResponse<Array<Record<string, unknown>>> | null> {
  const query = buildQuery({ first });
  return getJson<ScalarDataResponse<Array<Record<string, unknown>>>>(
    `/api/operator-unstakeds${query}`,
  );
}

export async function fetchTenantRuntimeConfig(
  tenantId: string,
): Promise<ScalarDataResponse<{
  minOperatorStake: number;
  unstakeCooldown: number;
}> | null> {
  const query = buildQuery({ tenantId });
  return getJson<
    ScalarDataResponse<{
      minOperatorStake: number;
      unstakeCooldown: number;
    }>
  >(`/api/tenant-runtime-config${query}`);
}

export async function fetchTenantCurrentInfo(
  tenantId: string,
): Promise<ScalarDataResponse<Record<string, unknown> | null> | null> {
  const query = buildQuery({ tenantId });
  return getJson<ScalarDataResponse<Record<string, unknown> | null>>(
    `/api/tenant-info${query}`,
  );
}

export async function fetchOperatorCurrentStatus(
  tenantId: string,
  operator: string,
): Promise<ScalarDataResponse<Record<string, unknown> | null> | null> {
  const query = buildQuery({ tenantId, operator });
  return getJson<ScalarDataResponse<Record<string, unknown> | null>>(
    `/api/operator-status${query}`,
  );
}

export async function fetchDocumentCurrentStatus(
  tenantId: string,
  fileHash: string,
): Promise<ScalarDataResponse<Record<string, unknown> | null> | null> {
  const query = buildQuery({ tenantId, fileHash });
  return getJson<ScalarDataResponse<Record<string, unknown> | null>>(
    `/api/document-status${query}`,
  );
}
