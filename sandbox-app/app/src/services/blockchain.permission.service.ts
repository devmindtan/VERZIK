import { ethers } from "ethers";

const BASE = import.meta.env.VITE_BACKEND_URL;

export type PermissionRole =
  | "PROTOCOL_OWNER"
  | "TENANT_ADMIN"
  | "TENANT_TREASURY"
  | "TENANT_OPERATOR"
  | "OPERATOR"
  | "GUEST";

interface CheckPermissionApiResponse {
  success: boolean;
  role?: string;
  message?: string;
}

export function convertPrivateKeyToAddress(privateKey: string): string {
  const sanitized = privateKey.trim();
  const normalized = sanitized.startsWith("0x") ? sanitized : `0x${sanitized}`;
  return ethers.computeAddress(normalized);
}

function normalizeRole(role: string): PermissionRole {
  if (role === "TENANT_MANAGER") {
    return "TENANT_OPERATOR";
  }

  if (
    role === "PROTOCOL_OWNER" ||
    role === "TENANT_ADMIN" ||
    role === "TENANT_TREASURY" ||
    role === "TENANT_OPERATOR" ||
    role === "OPERATOR" ||
    role === "GUEST"
  ) {
    return role;
  }

  return "GUEST";
}

export async function checkPermission(
  privateKey: string,
): Promise<PermissionRole | null> {
  try {
    const address = convertPrivateKeyToAddress(privateKey);
    const res = await fetch(`${BASE}/api/check-permission`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address,
      }),
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as CheckPermissionApiResponse;
    if (!data.success || !data.role) {
      return null;
    }

    return normalizeRole(data.role);
  } catch {
    return null;
  }
}
