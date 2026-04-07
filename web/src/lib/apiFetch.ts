/**
 * API Fetch - Template (simplified, no real API connections)
 */

const TOKEN_KEY = "auth_token";

/**
 * Simple fetch wrapper (mock)
 */
export async function apiFetch(
  url: string,
  options: RequestInit & { skipAuth?: boolean; bypassCache?: boolean } = {}
): Promise<Response> {
  const { skipAuth, bypassCache, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);
  
  if (!skipAuth) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  headers.set("Content-Type", "application/json");

  // TODO: Connect to your API
  console.log("Mock API call:", url, fetchOptions.method || "GET");
  
  // Return mock response
  return new Response(JSON.stringify({ success: true, data: [] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Clear API cache (no-op in mock)
 */
export function clearApiCache(urlPattern?: RegExp) {
  console.log("Clear API cache:", urlPattern);
}
