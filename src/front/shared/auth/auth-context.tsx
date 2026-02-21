import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { clearToken, setToken } from "../api/client";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        clearToken();
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((token: string, authUser: AuthUser) => {
    setToken(token);
    localStorage.setItem("user", JSON.stringify(authUser));
    setUser(authUser);
  }, []);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, updateUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
