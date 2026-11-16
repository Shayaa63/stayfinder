"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import type { User } from "@/types";
import { api } from "@/lib/api";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    try {
      const result = await api<{ user: User }>("/auth/me");
      setUser(result.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await api("/auth/logout", { method: "POST" });
    setUser(null);
  }

  useEffect(() => {
  let active = true;

  async function loadInitialUser() {
    try {
      const result = await api<{ user: User }>("/auth/me");

      if (active) {
        setUser(result.user);
      }
    } catch {
      if (active) {
        setUser(null);
      }
    } finally {
      if (active) {
        setLoading(false);
      }
    }
  }

  void loadInitialUser();

  return () => {
    active = false;
  };
}, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, refreshUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}