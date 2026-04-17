const BASE = import.meta.env.VITE_BACKEND_URL;

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

export async function fetchDocumentAnchoreds(
  first?: number,
): Promise<FullDataResponse | null> {
  try {
    const query = first ? `?first=${first}` : "";
    const res = await fetch(`${BASE}/api/document-anchoreds?${query}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch {
    return null;
  }
}
export async function fetchTenantCount(): Promise<DataResponse | null> {
  try {
    const res = await fetch(`${BASE}/api/tenant-count`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch {
    return null;
  }
}
export async function fetchOperatorJoineds(
  first?: number,
): Promise<FullDataResponse | null> {
  try {
    const query = first ? `?first=${first}` : "";
    const res = await fetch(`${BASE}/api/operator-joineds?${query}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch {
    return null;
  }
}
export async function fetchTenantCreateds(
  first?: number,
): Promise<DataResponse | null> {
  try {
    const query = first ? `?first=${first}` : "";
    const res = await fetch(`${BASE}/api/tenant-createds?${query}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch {
    return null;
  }
}
