import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, setToken } from "./api";

export interface AuthUser {
  role: "trainer" | "client";
  clientId?: number;
  firstName?: string;
  lastName?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  loginAsTrainer: (password: string) => Promise<void>;
  loginAsClient: (accessCode: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "pt_auth_token";
const USER_KEY = "pt_auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch {
        // ignore corrupt storage
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const loginAsTrainer = useCallback(async (password: string) => {
    const res = await api.post<{ token: string; user: AuthUser }>(
      "/auth/trainer-login",
      { password }
    );
    setToken(res.token);
    setUser(res.user);
    await AsyncStorage.setItem(TOKEN_KEY, res.token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(res.user));
  }, []);

  const loginAsClient = useCallback(async (accessCode: string) => {
    const res = await api.post<{ token: string; user: AuthUser }>(
      "/auth/client-login",
      { access_code: accessCode }
    );
    setToken(res.token);
    setUser(res.user);
    await AsyncStorage.setItem(TOKEN_KEY, res.token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(res.user));
  }, []);

  const logout = useCallback(async () => {
    // Try to unregister push token before clearing auth
    try {
      const storedToken = await AsyncStorage.getItem("pt_push_token");
      if (storedToken) {
        await api.post("/notifications/unregister", { expo_push_token: storedToken });
        await AsyncStorage.removeItem("pt_push_token");
      }
    } catch {
      // Non-fatal
    }
    setToken(null);
    setUser(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, loginAsTrainer, loginAsClient, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
