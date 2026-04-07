"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { AuthUser } from "@/services/auth.service";

// ──────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────
export interface AuthState {
  isAuthenticated: boolean; // false = viewer anonymous, true = technician
  role: "viewer" | "technician";
  routePrefix: string; // "user" cho viewer, email prefix cho technician
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthState | null>(null);

const TOKEN_KEY = "auth_token";
const ROLE_KEY = "auth_role";

// ──────────────────────────────────────────────────────────────────
// AuthProvider - TEMPLATE (API connections removed)
// ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  );
  const [role, setRole] = useState<"viewer" | "technician">(
    () =>
      (localStorage.getItem(ROLE_KEY) as "viewer" | "technician") || "viewer",
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /** Lưu token vào state + localStorage */
  const saveToken = useCallback((t: string, r: "viewer" | "technician") => {
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(ROLE_KEY, r);
    setToken(t);
    setRole(r);
  }, []);

  /** Xóa auth state */
  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    setToken(null);
    setRole("viewer");
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  /** Khởi tạo auth khi app load - MOCK */
  useEffect(() => {
    // TODO: Connect to your API to initialize authentication
    const mockToken = "mock-guest-token";
    saveToken(mockToken, "viewer");
    setIsLoading(false);
  }, [saveToken]);

  /**
   * Đăng nhập - MOCK
   */
  const login = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      // TODO: Connect to your API
      console.log("Mock login:", email, password);

      // Mock success
      const mockToken = "mock-tech-token";
      const mockUser: AuthUser = {
        id: "1",
        email: email,
        full_name: "Mock User",
        role: "technician",
      };

      saveToken(mockToken, "technician");
      setUser(mockUser);
      setIsAuthenticated(true);
      return null; // null = success
    },
    [saveToken],
  );

  /**
   * Đăng xuất - MOCK
   */
  const logout = useCallback(async () => {
    // TODO: Connect to your API
    console.log("Mock logout");
    clearAuth();
    const mockToken = "mock-guest-token";
    saveToken(mockToken, "viewer");
  }, [clearAuth, saveToken]);

  /** Trả về token hiện tại */
  const getToken = useCallback(() => token, [token]);

  /** Route prefix */
  const routePrefix =
    isAuthenticated && user?.email
      ? user.email.split("@")[0].toLowerCase()
      : "";

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        role,
        routePrefix,
        user,
        token,
        isLoading,
        login,
        logout,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải dùng bên trong AuthProvider");
  return ctx;
}
