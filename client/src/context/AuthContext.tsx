// AuthContext.tsx

import { createContext, useContext, useEffect, useState } from "react";

interface User {
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isLoggedIn = Boolean(user);

  // Runs once when the app loads
  async function refreshUser() {
    try {
      const res = await fetch("http://localhost:8080/api/auth/check", {
        method: "GET",
        credentials: "include", // important to send the cookie
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  // User login
  async function login(data: User) {
    setUser(data);
  }

  // User logout
  async function logout() {
    try {
      const res = await fetch("http://localhost:8080/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to logout");
    } catch (err: any) {
      console.error("Logout error", err);
    } finally {
      setUser(null); // clear user in context
    }
  }

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
